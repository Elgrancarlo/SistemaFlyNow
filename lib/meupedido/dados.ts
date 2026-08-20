// Camada de dados da página pública "Meu Pedido" (rastreio pelo cliente).
// Toda consulta parte do CPF — é a chave de liberação escolhida pelo negócio.
import { createServiceClient } from "@/lib/supabase";
import { conteudoDoProduto, type ConteudoProduto } from "./conteudo-produtos";
import { nomeExibicaoProduto } from "./nome-produto";
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

export interface PedidoDetalhe {
  codigo: string;
  primeiro_nome: string;
  cliente_nome: string;
  produto: string;
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
    .select("payt_transaction_id,produto_nome,produto_grupo,valor_total,status,data_pagamento,codigo_rastreio,status_pagamento,chargeback")
    .eq("cliente_cpf", digits)
    .in("status_pagamento", PAGAMENTOS_VISIVEIS)
    .order("data_pagamento", { ascending: false, nullsFirst: false })
    .limit(30);
  return (data ?? [])
    .filter((p) => p.payt_transaction_id)
    .map((p) => ({
      codigo: p.payt_transaction_id as string,
      produto: nomeExibicaoProduto(p.produto_nome as string | null, p.produto_grupo as string | null),
      valor_total: p.valor_total as number | null,
      status: p.status as string,
      data_pagamento: p.data_pagamento as string | null,
      tem_rastreio: Boolean(p.codigo_rastreio),
    }));
}

interface LoggiEvento {
  status?: { code?: string; highLevelStatus?: string; description?: string; updatedTime?: string };
  location?: { city?: string; state?: string };
}

export async function detalhePedido(cpf: string, codigo: string): Promise<PedidoDetalhe | null> {
  const digits = soDigitos(cpf);
  if (digits.length !== 11 || !codigo) return null;
  const db = createServiceClient();
  const { data: pedido } = await db
    .from("pedidos")
    .select(
      "payt_transaction_id,cliente_nome,cliente_cpf,produto_nome,produto_grupo,qtd_potes,valor_total,forma_pagamento,parcelas,status,codigo_rastreio,data_pagamento,data_prometida_entrega,data_entrega,data_chegou_logistica,endereco_entrega,created_at"
    )
    .eq("cliente_cpf", digits)
    .eq("payt_transaction_id", codigo)
    .in("status_pagamento", PAGAMENTOS_VISIVEIS)
    .maybeSingle();
  if (!pedido) return null;

  const destinoInfo = lerEndereco(pedido.endereco_entrega as Record<string, unknown> | null);
  const destinoCoord =
    destinoInfo.cidade && destinoInfo.uf ? coordDaCidade(destinoInfo.cidade, destinoInfo.uf) : null;

  // Eventos do lado do pedido (sempre existem)
  const timeline: EventoTimeline[] = [];
  const confirmadoEm = (pedido.data_pagamento ?? pedido.created_at) as string | null;
  timeline.push({
    titulo: "Pedido confirmado",
    descricao: "Recebemos o seu pedido.",
    cidade: null,
    uf: null,
    quando: confirmadoEm,
    atual: false,
  });
  if (pedido.data_pagamento) {
    timeline.push({
      titulo: "Pagamento aprovado",
      descricao: null,
      cidade: null,
      uf: null,
      quando: pedido.data_pagamento as string,
      atual: false,
    });
  }

  // Histórico da transportadora: o último webhook da Loggi traz o
  // trackingHistory COMPLETO — basta o evento mais recente do rastreio.
  let ultimaPosicao: PedidoDetalhe["ultima_posicao"] = null;
  let previsao: string | null = (pedido.data_prometida_entrega as string | null) ?? null;
  let teveEventosTransportadora = false;
  if (pedido.codigo_rastreio) {
    const { data: eventos } = await db
      .from("h7_eventos_raw")
      .select("payload_raw,created_at")
      .eq("tracking_code", pedido.codigo_rastreio)
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
  if (!teveEventosTransportadora && pedido.data_chegou_logistica) {
    timeline.push({
      titulo: "Recebido na base logística",
      descricao: "Seu pedido está com a transportadora.",
      cidade: null,
      uf: null,
      quando: pedido.data_chegou_logistica as string,
      atual: false,
    });
  }
  if (!ultimaPosicao && pedido.status === "entregue" && destinoInfo.cidade && destinoInfo.uf && destinoCoord) {
    ultimaPosicao = {
      cidade: destinoInfo.cidade,
      uf: destinoInfo.uf,
      lat: destinoCoord[0],
      lng: destinoCoord[1],
      descricao: "Objeto entregue ao destinatário",
      quando: (pedido.data_entrega as string | null) ?? null,
    };
  }

  // Entregue: evento final vindo do próprio pedido
  if (pedido.status === "entregue") {
    timeline.push({
      titulo: "Entregue",
      descricao: "Seu pedido chegou. Bom proveito!",
      cidade: destinoInfo.cidade,
      uf: destinoInfo.uf,
      quando: (pedido.data_entrega as string | null) ?? null,
      atual: false,
    });
  }

  // Mais recente primeiro; o primeiro é o "atual"
  timeline.sort((a, b) => ((a.quando ?? "") < (b.quando ?? "") ? 1 : -1));
  if (timeline.length) timeline[0].atual = true;

  const nome = ((pedido.cliente_nome as string) ?? "").trim();

  return {
    codigo: pedido.payt_transaction_id as string,
    primeiro_nome: nome.split(/\s+/)[0] || "cliente",
    cliente_nome: nome,
    produto: nomeExibicaoProduto(
      pedido.produto_nome as string | null,
      pedido.produto_grupo as string | null
    ),
    valor_total: pedido.valor_total as number | null,
    forma_pagamento: pedido.forma_pagamento as string | null,
    parcelas: pedido.parcelas as number | null,
    status: pedido.status as string,
    etapa: ETAPA_POR_STATUS[pedido.status as string] ?? 1,
    devolvido: pedido.status === "devolvido",
    codigo_rastreio: pedido.codigo_rastreio as string | null,
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
    qtd_potes: pedido.qtd_potes as number | null,
    data_pagamento: pedido.data_pagamento as string | null,
    conteudo: conteudoDoProduto(
      pedido.produto_nome as string | null,
      pedido.produto_grupo as string | null
    ),
  };
}
