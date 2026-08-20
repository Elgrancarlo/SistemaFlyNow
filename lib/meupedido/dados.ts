// Camada de dados da página pública "Meu Pedido" (rastreio pelo cliente).
// Toda consulta parte do CPF — é a chave de liberação escolhida pelo negócio.
import { createServiceClient } from "@/lib/supabase";
import { conteudoDoProduto, type ConteudoProduto } from "./conteudo-produtos";
import { ehPedidoAdicional, nomeExibicaoProduto } from "./nome-produto";
import municipiosRaw from "./municipios.json";

const MUNICIPIOS = municipiosRaw as unknown as Record<string, [number, number]>;

// ── Tipos expostos à página ──────────────────────────────────────────────────

export interface PedidoResumo {
  codigo: string; // payt_transaction_id
  produto: string;
  valor_total: number | null;
  status: string;
  data_pagamento: string | null;
  tem_rastreio: boolean;
}

export interface EventoTimeline {
  titulo: string;
  descricao: string | null;
  cidade: string | null;
  uf: string | null;
  quando: string | null; // ISO
  atual: boolean;
}

export interface ItemCompra {
  produto: string;
  qtd_potes: number | null;
  valor_total: number | null;
}

export interface PedidoDetalhe {
  codigo: string;
  primeiro_nome: string;
  cliente_nome: string;
  produto: string;
  itens: ItemCompra[];
  valor_total: number | null;
  forma_pagamento: string | null;
  parcelas: number | null;
  status: string;
  etapa: number; // 0..4 no stepper (Confirmado, Preparando, Postado, Em trânsito, Entregue)
  devolvido: boolean;
  codigo_rastreio: string | null;
  previsao_entrega: string | null;
  destino: { cidade: string | null; uf: string | null; lat: number | null; lng: number | null };
  ultima_posicao: {
    cidade: string;
    uf: string;
    lat: number;
    lng: number;
    descricao: string | null;
    quando: string | null;
  } | null;
  timeline: EventoTimeline[];
  endereco_resumo: string | null;
  endereco_completo: string[] | null;
  qtd_potes: number | null;
  data_pagamento: string | null;
  conteudo: ConteudoProduto | null;
}

// ── Normalizações ────────────────────────────────────────────────────────────

function soDigitos(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

export function coordDaCidade(cidade: string, uf: string): [number, number] | null {
  if (!cidade || !uf) return null;
  return MUNICIPIOS[`${semAcento(cidade)}|${uf.toUpperCase().trim()}`] ?? null;
}

// endereco_entrega tem dois formatos históricos no banco:
// antigo {cidade, estado, rua, numero, bairro, cep} e novo {city, state, street, ...}.
function lerEndereco(e: Record<string, unknown> | null): {
  cidade: string | null;
  uf: string | null;
  resumo: string | null;
  completo: string[] | null;
} {
  if (!e) return { cidade: null, uf: null, resumo: null, completo: null };
  const cidade = ((e.cidade ?? e.city) as string) || null;
  const uf = ((e.estado ?? e.state) as string) || null;
  const bairro = ((e.bairro ?? e.district) as string) || null;
  const rua = ((e.rua ?? e.street) as string) || null;
  const numero = ((e.numero ?? e.street_number) as string) || null;
  const compl = ((e.complemento ?? e.complement) as string) || null;
  const cep = ((e.cep ?? e.zipcode) as string) || null;
  const resumo = [bairro, cidade && uf ? `${cidade}/${uf}` : cidade].filter(Boolean).join(" — ") || null;
  const linhas = [
    [rua, numero].filter(Boolean).join(", ") || null,
    compl,
    bairro,
    cidade && uf ? `${cidade}/${uf}` : cidade,
    cep ? `CEP ${cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}` : null,
  ].filter(Boolean) as string[];
  return { cidade, uf, resumo, completo: linhas.length ? linhas : null };
}

// ── Stepper: status interno → etapa (mesmas 5 do modelo de referência) ───────

const ETAPA_POR_STATUS: Record<string, number> = {
  pago: 1,
  nota_fiscal: 1,
  separacao: 1,
  aguardando_postagem: 1,
  postado: 2,
  em_transporte: 3,
  aguardando_retirada: 3,
  entregue: 4,
  devolvido: 3,
};

const STATUS_PRIORIDADE: Record<string, number> = {
  aguardando_postagem: 0,
  pago: 0,
  nota_fiscal: 0,
  separacao: 0,
  postado: 1,
  em_transporte: 2,
  aguardando_retirada: 3,
  entregue: 4,
  devolvido: 5,
};

// ── Agrupamento: mesma compra aos olhos do cliente ───────────────────────────
// O upsell pós-checkout vira transação própria na Payt, mas é a MESMA compra e
// viaja no envio do principal. Agrupa por rastreio compartilhado ou, antes da
// postagem, por pedido adicional pago até 45 min do principal.

interface LinhaCompra {
  payt_transaction_id: string;
  produto_nome: string | null;
  produto_grupo: string | null;
  qtd_potes: number | null;
  valor_total: number | null;
  status: string;
  codigo_rastreio: string | null;
  data_pagamento: string | null;
}

function mesmaCompra(a: LinhaCompra, b: LinhaCompra): boolean {
  if (a.codigo_rastreio && a.codigo_rastreio === b.codigo_rastreio) return true;
  const ta = a.data_pagamento ? Date.parse(a.data_pagamento) : NaN;
  const tb = b.data_pagamento ? Date.parse(b.data_pagamento) : NaN;
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return (
    Math.abs(ta - tb) <= 45 * 60_000 &&
    (ehPedidoAdicional(a.produto_nome) || ehPedidoAdicional(b.produto_nome))
  );
}

function agruparCompras<T extends LinhaCompra>(rows: T[]): T[][] {
  const grupos: T[][] = [];
  for (const row of rows) {
    const grupo = grupos.find((g) => g.some((r) => mesmaCompra(r, row)));
    if (grupo) grupo.push(row);
    else grupos.push([row]);
  }
  return grupos;
}

// rows vêm ordenadas por data_pagamento desc → o principal é a linha não-adicional
// (fallback: a mais antiga, que é a última do grupo).
function principalDaCompra<T extends LinhaCompra>(grupo: T[]): T {
  return grupo.find((r) => !ehPedidoAdicional(r.produto_nome)) ?? grupo[grupo.length - 1];
}

function statusDaCompra(grupo: LinhaCompra[]): string {
  return grupo.reduce(
    (melhor, r) =>
      (STATUS_PRIORIDADE[r.status] ?? 0) > (STATUS_PRIORIDADE[melhor] ?? 0) ? r.status : melhor,
    grupo[0].status
  );
}

function somaOuNull(grupo: LinhaCompra[], campo: "valor_total" | "qtd_potes"): number | null {
  if (!grupo.some((r) => r[campo] != null)) return null;
  return grupo.reduce((s, r) => s + (r[campo] ?? 0), 0);
}

// Título consolidado: adicionais do mesmo produto viram um kit maior
// ("Derma Bloom · 9 potes"); produtos diferentes viram "+ N itens".
function tituloDaCompra(grupo: LinhaCompra[], principal: LinhaCompra): string {
  if (grupo.length === 1) {
    return nomeExibicaoProduto(principal.produto_nome, principal.produto_grupo);
  }
  const mesmoProduto =
    principal.produto_grupo &&
    grupo.every((r) => (r.produto_grupo ?? "") === principal.produto_grupo);
  if (mesmoProduto) {
    const potes = somaOuNull(grupo, "qtd_potes");
    const base = nomeExibicaoProduto(null, principal.produto_grupo);
    return potes ? `${base} · ${potes} potes` : base;
  }
  const extras = grupo.length - 1;
  const nome = nomeExibicaoProduto(principal.produto_nome, principal.produto_grupo);
  return `${nome} + ${extras} ${extras === 1 ? "item" : "itens"}`;
}

// ── Consultas ────────────────────────────────────────────────────────────────

// O cliente só vê compra CONCLUÍDA. O banco guarda toda tentativa de cobrança
// (televendas re-tenta cartão: ~20% das linhas são canceled) — canceled,
// expired e waiting_payment nunca aparecem na página.
const PAGAMENTOS_VISIVEIS = ["paid", "chargeback", "refund_requested", "refunded"];

export async function listarPedidosPorCpf(cpf: string): Promise<PedidoResumo[]> {
  const digits = soDigitos(cpf);
  if (digits.length !== 11) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("pedidos")
    .select("payt_transaction_id,produto_nome,produto_grupo,qtd_potes,valor_total,status,data_pagamento,codigo_rastreio,status_pagamento,chargeback")
    .eq("cliente_cpf", digits)
    .in("status_pagamento", PAGAMENTOS_VISIVEIS)
    .order("data_pagamento", { ascending: false, nullsFirst: false })
    .limit(30);
  const rows = (data ?? []).filter((p) => p.payt_transaction_id) as unknown as LinhaCompra[];
  return agruparCompras(rows).map((grupo) => {
    const principal = principalDaCompra(grupo);
    return {
      codigo: principal.payt_transaction_id,
      produto: tituloDaCompra(grupo, principal),
      valor_total: somaOuNull(grupo, "valor_total"),
      status: statusDaCompra(grupo),
      data_pagamento: principal.data_pagamento,
      tem_rastreio: grupo.some((r) => Boolean(r.codigo_rastreio)),
    };
  });
}

interface LoggiEvento {
  status?: { code?: string; highLevelStatus?: string; description?: string; updatedTime?: string };
  location?: { city?: string; state?: string };
}

export async function detalhePedido(cpf: string, codigo: string): Promise<PedidoDetalhe | null> {
  const digits = soDigitos(cpf);
  if (digits.length !== 11 || !codigo) return null;
  const db = createServiceClient();
  const { data } = await db
    .from("pedidos")
    .select(
      "payt_transaction_id,cliente_nome,cliente_cpf,produto_nome,produto_grupo,qtd_potes,valor_total,forma_pagamento,parcelas,status,codigo_rastreio,data_pagamento,data_prometida_entrega,data_entrega,data_chegou_logistica,endereco_entrega,created_at"
    )
    .eq("cliente_cpf", digits)
    .in("status_pagamento", PAGAMENTOS_VISIVEIS)
    .order("data_pagamento", { ascending: false, nullsFirst: false })
    .limit(30);

  type LinhaDetalhe = LinhaCompra & {
    cliente_nome: string | null;
    forma_pagamento: string | null;
    parcelas: number | null;
    data_prometida_entrega: string | null;
    data_entrega: string | null;
    data_chegou_logistica: string | null;
    endereco_entrega: Record<string, unknown> | null;
    created_at: string | null;
  };
  const rows = (data ?? []).filter((p) => p.payt_transaction_id) as unknown as LinhaDetalhe[];

  // O cliente pode chegar tanto pelo código do principal quanto pelo do
  // adicional (links antigos) — os dois abrem a mesma compra.
  const grupo = agruparCompras(rows).find((g) =>
    g.some((r) => r.payt_transaction_id === codigo)
  );
  if (!grupo) return null;

  const principal = principalDaCompra(grupo);
  const status = statusDaCompra(grupo);
  const codigoRastreio = grupo.map((r) => r.codigo_rastreio).find(Boolean) ?? null;
  const dataEntrega = grupo.map((r) => r.data_entrega).find(Boolean) ?? null;
  const dataChegouLogistica = grupo.map((r) => r.data_chegou_logistica).find(Boolean) ?? null;

  const destinoInfo = lerEndereco(principal.endereco_entrega);
  const destinoCoord =
    destinoInfo.cidade && destinoInfo.uf ? coordDaCidade(destinoInfo.cidade, destinoInfo.uf) : null;

  // Eventos do lado do pedido (sempre existem)
  const timeline: EventoTimeline[] = [];
  const confirmadoEm = principal.data_pagamento ?? principal.created_at;
  timeline.push({
    titulo: "Pedido confirmado",
    descricao: "Recebemos o seu pedido.",
    cidade: null,
    uf: null,
    quando: confirmadoEm,
    atual: false,
  });
  if (principal.data_pagamento) {
    timeline.push({
      titulo: "Pagamento aprovado",
      descricao: null,
      cidade: null,
      uf: null,
      quando: principal.data_pagamento,
      atual: false,
    });
  }

  // Histórico da transportadora: o último webhook da Loggi traz o
  // trackingHistory COMPLETO — basta o evento mais recente do rastreio.
  let ultimaPosicao: PedidoDetalhe["ultima_posicao"] = null;
  let previsao: string | null = grupo.map((r) => r.data_prometida_entrega).find(Boolean) ?? null;
  let teveEventosTransportadora = false;
  if (codigoRastreio) {
    const { data: eventos } = await db
      .from("h7_eventos_raw")
      .select("payload_raw,created_at")
      .eq("tracking_code", codigoRastreio)
      .order("created_at", { ascending: false })
      .limit(1);
    const payload = eventos?.[0]?.payload_raw as
      | { trackingHistory?: LoggiEvento[]; promisedDate?: string }
      | undefined;
    if (payload?.promisedDate && !previsao) previsao = payload.promisedDate;

    const historia = (payload?.trackingHistory ?? [])
      .filter((ev) => ev?.status?.updatedTime)
      .sort((a, b) => (a.status!.updatedTime! < b.status!.updatedTime! ? -1 : 1));
    teveEventosTransportadora = historia.length > 0;

    for (const ev of historia) {
      timeline.push({
        titulo: ev.status?.highLevelStatus ?? "Atualização",
        descricao: ev.status?.description ?? null,
        cidade: ev.location?.city || null,
        uf: ev.location?.state || null,
        quando: ev.status?.updatedTime ?? null,
        atual: false,
      });
    }

    // Última movimentação com cidade conhecida → pin do mapa
    for (let i = historia.length - 1; i >= 0; i--) {
      const ev = historia[i];
      const city = ev.location?.city ?? "";
      const uf = ev.location?.state ?? "";
      const coord = coordDaCidade(city, uf);
      if (coord) {
        ultimaPosicao = {
          cidade: city,
          uf,
          lat: coord[0],
          lng: coord[1],
          descricao: ev.status?.description ?? null,
          quando: ev.status?.updatedTime ?? null,
        };
        break;
      }
    }
  }

  // Envios pela malha postal da H7 não emitem eventos por cidade (só a malha
  // Loggi emite). Sem eventos da transportadora, os marcos do próprio pedido
  // preenchem a timeline; entregue, o mapa pina o destino.
  if (!teveEventosTransportadora && dataChegouLogistica) {
    timeline.push({
      titulo: "Recebido na base logística",
      descricao: "Seu pedido está com a transportadora.",
      cidade: null,
      uf: null,
      quando: dataChegouLogistica,
      atual: false,
    });
  }
  if (!ultimaPosicao && status === "entregue" && destinoInfo.cidade && destinoInfo.uf && destinoCoord) {
    ultimaPosicao = {
      cidade: destinoInfo.cidade,
      uf: destinoInfo.uf,
      lat: destinoCoord[0],
      lng: destinoCoord[1],
      descricao: "Objeto entregue ao destinatário",
      quando: dataEntrega,
    };
  }

  // Entregue: evento final vindo do próprio pedido
  if (status === "entregue") {
    timeline.push({
      titulo: "Entregue",
      descricao: "Seu pedido chegou. Bom proveito!",
      cidade: destinoInfo.cidade,
      uf: destinoInfo.uf,
      quando: dataEntrega,
      atual: false,
    });
  }

  // Mais recente primeiro; o primeiro é o "atual"
  timeline.sort((a, b) => ((a.quando ?? "") < (b.quando ?? "") ? 1 : -1));
  if (timeline.length) timeline[0].atual = true;

  const nome = (principal.cliente_nome ?? "").trim();
  const itens: ItemCompra[] = [principal, ...grupo.filter((r) => r !== principal)].map((r) => ({
    produto: nomeExibicaoProduto(r.produto_nome, r.produto_grupo),
    qtd_potes: r.qtd_potes,
    valor_total: r.valor_total,
  }));

  return {
    codigo: principal.payt_transaction_id,
    primeiro_nome: nome.split(/\s+/)[0] || "cliente",
    cliente_nome: nome,
    produto: tituloDaCompra(grupo, principal),
    itens,
    valor_total: somaOuNull(grupo, "valor_total"),
    forma_pagamento: principal.forma_pagamento,
    parcelas: principal.parcelas,
    status,
    etapa: ETAPA_POR_STATUS[status] ?? 1,
    devolvido: status === "devolvido",
    codigo_rastreio: codigoRastreio,
    previsao_entrega: previsao,
    destino: {
      cidade: destinoInfo.cidade,
      uf: destinoInfo.uf,
      lat: destinoCoord?.[0] ?? null,
      lng: destinoCoord?.[1] ?? null,
    },
    ultima_posicao: ultimaPosicao,
    timeline,
    endereco_resumo: destinoInfo.resumo,
    endereco_completo: destinoInfo.completo,
    qtd_potes: somaOuNull(grupo, "qtd_potes"),
    data_pagamento: principal.data_pagamento,
    conteudo: conteudoDoProduto(principal.produto_nome, principal.produto_grupo),
  };
}
