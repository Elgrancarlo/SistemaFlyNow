"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MapPin,
  Package,
} from "lucide-react";
import dynamic from "next/dynamic";

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

interface PedidoDetalhe {
  codigo: string;
  primeiro_nome: string;
  produto: string;
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
}

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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Package className="h-6 w-6" aria-hidden />
          </div>
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

      {/* Atendimento */}
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

      {pedido.endereco_resumo && (
        <p className="mt-4 text-center text-xs text-stone-400">
          Entrega em: {pedido.endereco_resumo}
        </p>
      )}
    </main>
  );
}
