"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Gift,
  Headset,
  Lightbulb,
  Mail,
  MapPin,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";
import dynamic from "next/dynamic";
import { midiaDoProduto } from "@/lib/meupedido/midia-produtos";

// A malha do mapa pesa ~60 KB — só baixa quando o pedido tem posição no rastreio.
const MapaPedido = dynamic(() => import("./mapa-pedido").then((m) => m.MapaPedido), {
  ssr: false,
  loading: () => <div className="h-52 w-full animate-pulse bg-stone-100" />,
});

interface EventoTimeline {
  titulo: string;
  descricao: string | null;
  cidade: string | null;
  uf: string | null;
  quando: string | null;
  atual: boolean;
}

interface ItemCompra {
  produto: string;
  qtd_potes: number | null;
  valor_total: number | null;
}

interface PedidoDetalhe {
  codigo: string;
  primeiro_nome: string;
  produto: string;
  itens: ItemCompra[];
  valor_total: number | null;
  forma_pagamento: string | null;
  parcelas: number | null;
  status: string;
  etapa: number;
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
  conteudo: {
    nome: string;
    categoria: string;
    descricao: string;
    uso: { rotulo: string; valor: string }[];
    passos?: string[];
    dicas: string[];
    faq?: { pergunta: string; resposta: string }[];
    avisos: string[];
  } | null;
}

type Aba = "rastreio" | "pedido" | "usar" | "materiais" | "ajuda";

const ABAS: { id: Aba; rotulo: string; Icone: typeof Truck }[] = [
  { id: "rastreio", rotulo: "Rastreio", Icone: Truck },
  { id: "pedido", rotulo: "Pedido", Icone: ReceiptText },
  { id: "usar", rotulo: "Como usar", Icone: BookOpen },
  { id: "materiais", rotulo: "Materiais", Icone: Gift },
  { id: "ajuda", rotulo: "Atendimento", Icone: Headset },
];

const FORMA_PAGAMENTO: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  billet: "Boleto",
  boleto: "Boleto",
};

const ETAPAS = ["Confirmado", "Preparando", "Postado", "Em trânsito", "Entregue"];
const EMAIL_SUPORTE = "flylabs@flylabssuporte.com";

function saudacao(): string {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date())
  );
  if (h < 6) return "Boa noite";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataBR(iso: string | null, comHora = false): string {
  if (!iso) return "";
  // datas só-dia (YYYY-MM-DD) não podem passar pelo fuso, senão voltam 1 dia
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dia = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  if (!comHora) return dia;
  const hora = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return `${dia} · ${hora}`;
}

function valorBRL(v: number | null): string {
  if (v == null) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PedidoView({ codigo }: { codigo: string }) {
  const router = useRouter();
  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [aba, setAba] = useState<Aba>("rastreio");

  useEffect(() => {
    const cpf = sessionStorage.getItem("meupedido_cpf");
    if (!cpf) {
      router.replace("/meupedido");
      return;
    }
    let ativo = true;
    (async () => {
      try {
        const res = await fetch("/api/meupedido/pedido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf, codigo }),
        });
        const data = await res.json();
        if (!ativo) return;
        if (!res.ok) {
          setErro(data.error ?? "Erro ao carregar o pedido.");
          return;
        }
        setPedido(data.pedido);
      } catch {
        if (ativo) setErro("Falha de conexão. Tente novamente.");
      }
    })();
    return () => {
      ativo = false;
    };
  }, [codigo, router]);

  async function copiarRastreio() {
    if (!pedido?.codigo_rastreio) return;
    try {
      await navigator.clipboard.writeText(pedido.codigo_rastreio);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — sem drama */
    }
  }

  if (erro) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-medium text-stone-800">{erro}</p>
        <button
          onClick={() => router.push("/meupedido")}
          className="mt-4 rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white"
        >
          Voltar
        </button>
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className="flex flex-1 flex-col gap-4 pt-6" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl bg-stone-200/70" />
        <div className="h-56 animate-pulse rounded-2xl bg-stone-200/70" />
        <div className="h-72 animate-pulse rounded-2xl bg-stone-200/70" />
      </main>
    );
  }

  const destinoTxt =
    pedido.destino.cidade && pedido.destino.uf
      ? `${pedido.destino.cidade}/${pedido.destino.uf}`
      : null;

  const midia = midiaDoProduto(pedido.produto, pedido.conteudo?.nome ?? null);
  const abas = midia?.materiais?.length ? ABAS : ABAS.filter((a) => a.id !== "materiais");

  return (
    <main className="flex flex-1 flex-col">
      {/* Cabeçalho */}
      <header className="relative -mx-4 mb-5 rounded-b-3xl bg-gradient-to-br from-orange-600 to-orange-700 px-6 pt-8 pb-6 text-white shadow-lg shadow-orange-700/20">
        <button
          onClick={() => router.push("/meupedido")}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-orange-100 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Meus pedidos
        </button>
        <h1 className="text-xl font-bold">
          {saudacao()}, {pedido.primeiro_nome}!
        </h1>
        <p className="text-sm text-orange-100">Tudo do seu pedido em um só lugar</p>
      </header>

      {/* Card do pedido + stepper */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
        <p className="text-xs font-semibold tracking-wide text-stone-400 uppercase">
          Acompanhe seu pedido
        </p>
        <p className="mt-0.5 text-sm text-stone-500">Pedido #{pedido.codigo} · Flynow</p>

        <div className="mt-3 flex items-center gap-3">
          {midia?.foto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={midia.foto}
              alt={pedido.produto}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain ring-1 ring-stone-900/5"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Package className="h-6 w-6" aria-hidden />
            </div>
          )}
          <div>
            <p className="font-bold text-stone-900">{pedido.produto}</p>
            {pedido.valor_total != null && (
              <p className="text-sm text-stone-500">
                {valorBRL(pedido.valor_total)}
                {pedido.parcelas && pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ""}
              </p>
            )}
          </div>
        </div>

        {pedido.devolvido ? (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Este pedido retornou ao remetente. Fale com a gente pelo e-mail abaixo para
            resolvermos o reenvio.
          </div>
        ) : (
          <ol className="mt-5 flex items-start" aria-label="Etapas da entrega">
            {ETAPAS.map((nome, i) => {
              const feita = i < pedido.etapa;
              const atual = i === pedido.etapa;
              return (
                <li key={nome} className="relative flex flex-1 flex-col items-center">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={`absolute top-3.5 right-1/2 left-[-50%] h-0.5 ${
                        feita || atual ? "bg-orange-500" : "bg-stone-200"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      feita
                        ? "bg-orange-500 text-white"
                        : atual
                          ? "bg-white text-orange-600 ring-2 ring-orange-500"
                          : "bg-stone-100 text-stone-400 ring-1 ring-stone-200"
                    }`}
                  >
                    {feita ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={`mt-1.5 text-center text-[11px] leading-tight ${
                      atual ? "font-bold text-orange-700" : feita ? "text-stone-600" : "text-stone-400"
                    }`}
                  >
                    {nome}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {pedido.previsao_entrega &&
          pedido.status !== "entregue" &&
          !pedido.devolvido &&
          // previsão já vencida confunde mais do que ajuda — omite
          new Date(pedido.previsao_entrega) >= new Date(Date.now() - 24 * 3600 * 1000) && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-orange-600" aria-hidden />
            <span>
              <span className="font-semibold text-orange-800">Previsão de entrega:</span>{" "}
              <span className="text-stone-700">{dataBR(pedido.previsao_entrega)}</span>
            </span>
          </div>
        )}
      </section>

      {aba === "rastreio" && (
        <>
      {/* Onde está */}
      {pedido.ultima_posicao && (
        <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5">
          <div className="px-5 pt-4">
            <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
              Onde seu pedido está
            </p>
            <p className="text-xs text-stone-400">
              última movimentação registrada pela transportadora
            </p>
          </div>
          <MapaPedido
            posicao={{
              lat: pedido.ultima_posicao.lat,
              lng: pedido.ultima_posicao.lng,
              rotulo: `${pedido.ultima_posicao.cidade}/${pedido.ultima_posicao.uf}`,
            }}
            destino={
              pedido.destino.lat != null && pedido.destino.lng != null
                ? { lat: pedido.destino.lat, lng: pedido.destino.lng, rotulo: destinoTxt ?? "" }
                : null
            }
          />
          <div className="border-t border-stone-100 px-5 py-3">
            <p className="flex items-center gap-1.5 font-semibold text-stone-900">
              <MapPin className="h-4 w-4 text-orange-600" aria-hidden />
              {pedido.ultima_posicao.cidade}/{pedido.ultima_posicao.uf}
            </p>
            {pedido.ultima_posicao.descricao && (
              <p className="mt-0.5 text-sm text-stone-500">
                {pedido.ultima_posicao.descricao}
                {pedido.ultima_posicao.quando ? ` · ${dataBR(pedido.ultima_posicao.quando, true)}` : ""}
              </p>
            )}
            {destinoTxt && pedido.status !== "entregue" && (
              <p className="mt-1 text-sm font-semibold text-stone-700">→ Seguindo para {destinoTxt}</p>
            )}
          </div>
          <p className="border-t border-stone-100 bg-stone-50/60 px-5 py-2.5 text-[11px] leading-snug text-stone-400">
            Posição aproximada: mostramos a cidade da última movimentação informada pela
            transportadora — seu pedido pode já ter avançado desde então.
          </p>
        </section>
      )}

      {/* Linha do tempo */}
      <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
              Linha do tempo do seu pedido
            </p>
            <p className="text-xs text-stone-400">acompanhamento em tempo real</p>
          </div>
          {pedido.codigo_rastreio && (
            <button
              onClick={copiarRastreio}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
              title="Copiar código de rastreio"
            >
              {pedido.codigo_rastreio}
              {copiado ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          )}
        </div>

        <ol className="space-y-0">
          {pedido.timeline.map((ev, i) => (
            <li key={`${ev.titulo}-${ev.quando}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
              {i < pedido.timeline.length - 1 && (
                <span aria-hidden className="absolute top-6 left-[11px] h-full w-0.5 bg-stone-200" />
              )}
              <span
                className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  ev.atual
                    ? "bg-white ring-2 ring-orange-500"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {ev.atual ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${ev.atual ? "text-orange-700" : "text-stone-800"}`}>
                  {ev.titulo}
                </p>
                <p className="text-xs text-stone-500">
                  {[dataBR(ev.quando, true), ev.cidade && ev.uf ? `${ev.cidade}, ${ev.uf}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {ev.descricao && <p className="mt-0.5 text-xs text-stone-400">{ev.descricao}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
        </>
      )}

      {/* Aba Pedido: detalhes da compra e entrega */}
      {aba === "pedido" && (
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
          <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
            Detalhes do pedido
          </p>
          {/* Compra com pedido adicional: os itens aparecem juntos — é um pedido só */}
          {pedido.itens && pedido.itens.length > 1 && (
            <div className="mt-3 divide-y divide-stone-100 rounded-xl bg-stone-50 px-3.5">
              {pedido.itens.map((item, i) => (
                <div key={`${item.produto}-${i}`} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span className="text-stone-700">{item.produto}</span>
                  {item.valor_total != null && (
                    <span className="shrink-0 font-medium text-stone-900">{valorBRL(item.valor_total)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <dl className="mt-3 divide-y divide-stone-100 text-sm">
            {[
              ["Pedido", `#${pedido.codigo}`],
              pedido.itens && pedido.itens.length > 1 ? null : ["Produto", pedido.produto],
              pedido.qtd_potes ? ["Quantidade", `${pedido.qtd_potes} pote${pedido.qtd_potes > 1 ? "s" : ""}`] : null,
              pedido.valor_total != null
                ? [pedido.itens && pedido.itens.length > 1 ? "Valor total" : "Valor", valorBRL(pedido.valor_total)]
                : null,
              pedido.forma_pagamento
                ? [
                    "Pagamento",
                    `${FORMA_PAGAMENTO[pedido.forma_pagamento] ?? pedido.forma_pagamento}${
                      pedido.parcelas && pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ""
                    }`,
                  ]
                : null,
              pedido.data_pagamento ? ["Data da compra", dataBR(pedido.data_pagamento)] : null,
              pedido.codigo_rastreio ? ["Rastreio", pedido.codigo_rastreio] : null,
            ]
              .filter((r): r is [string, string] => Boolean(r))
              .map(([rotulo, valor]) => (
                <div key={rotulo} className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="shrink-0 text-stone-500">{rotulo}</dt>
                  <dd className="text-right font-medium text-stone-900">{valor}</dd>
                </div>
              ))}
          </dl>
          {pedido.endereco_completo && (
            <div className="mt-4 rounded-xl bg-stone-50 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> Endereço de entrega
              </p>
              {pedido.endereco_completo.map((linha) => (
                <p key={linha} className="text-sm text-stone-700">
                  {linha}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Aba Como usar: conteúdo curado por produto */}
      {aba === "usar" &&
        (pedido.conteudo ? (
          <>
            <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
              <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
                Sobre o produto
              </p>
              {midia?.foto && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={midia.foto}
                  alt={pedido.conteudo.nome}
                  width={640}
                  height={640}
                  className="mx-auto mt-3 h-40 w-40 object-contain"
                />
              )}
              <h2 className="mt-1 text-lg font-bold text-stone-900">{pedido.conteudo.nome}</h2>
              <p className="text-xs text-stone-400">{pedido.conteudo.categoria}</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {pedido.conteudo.descricao}
              </p>
            </section>

            <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
              <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
                Como usar
              </p>
              <dl className="mt-2 divide-y divide-stone-100 text-sm">
                {pedido.conteudo.uso.map((u) => (
                  <div key={u.rotulo} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="shrink-0 font-medium text-stone-500">{u.rotulo}</dt>
                    <dd className="text-right text-stone-800">{u.valor}</dd>
                  </div>
                ))}
              </dl>
              {midia?.guia && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={midia.guia}
                  alt={`Guia de preparo — ${pedido.conteudo.nome}`}
                  width={768}
                  height={1152}
                  loading="lazy"
                  className="mt-4 w-full rounded-xl ring-1 ring-stone-900/5"
                />
              )}
            </section>

            {pedido.conteudo.passos && pedido.conteudo.passos.length > 0 && (
              <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
                <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
                  Como preparar — passo a passo
                </p>
                <ol className="mt-2 space-y-2.5">
                  {pedido.conteudo.passos.map((passo, i) => (
                    <li key={passo} className="flex gap-2.5 text-sm text-stone-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-700">
                        {i + 1}
                      </span>
                      {passo}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
              <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
                Dicas para o melhor resultado
              </p>
              <ul className="mt-2 space-y-2.5">
                {pedido.conteudo.dicas.map((dica) => (
                  <li key={dica} className="flex gap-2.5 text-sm text-stone-700">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                    {dica}
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-stone-100 pt-3">
                {pedido.conteudo.avisos.map((aviso) => (
                  <p key={aviso} className="text-[11px] leading-snug text-stone-400">
                    {aviso}
                  </p>
                ))}
              </div>
            </section>

            {pedido.conteudo.faq && pedido.conteudo.faq.length > 0 && (
              <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
                <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
                  Perguntas frequentes
                </p>
                <div className="mt-2 divide-y divide-stone-100">
                  {pedido.conteudo.faq.map((item) => (
                    <details key={item.pergunta} className="group py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-stone-800 [&::-webkit-details-marker]:hidden">
                        {item.pergunta}
                        <span
                          aria-hidden
                          className="shrink-0 text-stone-400 transition-transform group-open:rotate-90"
                        >
                          ›
                        </span>
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.resposta}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="mt-4 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-900/5">
            <BookOpen className="mx-auto h-8 w-8 text-stone-300" aria-hidden />
            <p className="mt-2 font-medium text-stone-800">
              Siga as instruções de uso no rótulo do produto
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Qualquer dúvida sobre como usar o {pedido.produto}, nossa equipe te orienta pelo
              e-mail — é só chamar na aba Atendimento.
            </p>
            <button
              onClick={() => setAba("ajuda")}
              className="mt-3 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Falar com o suporte
            </button>
          </section>
        ))}

      {/* Aba Materiais: bônus em PDF que acompanham o produto */}
      {aba === "materiais" && midia?.materiais && midia.materiais.length > 0 && (
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
          <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
            Seus materiais
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Conteúdos que acompanham a sua compra. Toque para abrir — você também pode salvar
            no celular.
          </p>
          <ul className="mt-3 space-y-2.5">
            {midia.materiais.map((m) => (
              <li key={m.arquivo}>
                <a
                  href={m.arquivo}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-3 rounded-xl bg-stone-50 p-3.5 transition hover:bg-orange-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 ring-1 ring-stone-900/5">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-stone-800">
                    {m.titulo}
                  </span>
                  <span className="shrink-0 rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                    PDF
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Atendimento */}
      {aba === "ajuda" && (
      <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
        <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">Atendimento</p>
        <p className="mt-1 text-sm text-stone-600">
          Dúvida sobre o pedido, entrega ou como usar o produto? Nossa equipe responde rápido
          pelo e-mail.
        </p>
        <a
          href={`mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(`Ajuda com o pedido #${pedido.codigo}`)}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white transition hover:bg-stone-800"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Falar com o suporte
        </a>
        <p className="mt-2 text-center text-xs text-stone-400">{EMAIL_SUPORTE}</p>
      </section>
      )}

      {aba === "rastreio" && pedido.endereco_resumo && (
        <p className="mt-4 text-center text-xs text-stone-400">
          Entrega em: {pedido.endereco_resumo}
        </p>
      )}

      {/* Navegação inferior fixa (padrão do modelo de referência) */}
      <div className="h-20" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {abas.map(({ id, rotulo, Icone }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              aria-current={aba === id ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                aba === id ? "text-orange-600" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <Icone className="h-5 w-5" aria-hidden />
              {rotulo}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
