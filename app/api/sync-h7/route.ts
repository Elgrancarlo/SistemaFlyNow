import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { enviarWhatsappAguardandoRetirada } from "@/lib/whatsapp";
import { isTrustedAppRequest } from "@/lib/request-origin";
import { getTodayInAppTimezone, shiftDateString } from "@/lib/app-dates";

const H7_API_URL = process.env.H7_API_URL ?? "https://api.haga7digital.com.br/api/orders/fly";
const H7_TOKEN = process.env.H7_TOKEN ?? "";
const H7_PER_PAGE = 100;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

const STATUS_PRIORIDADE: Record<string, number> = {
  aguardando_postagem: 0,
  postado: 1,
  em_transporte: 2,
  aguardando_retirada: 3,
  entregue: 4,
  devolvido: 5,
};

function mapearStatusH7(h7Status: string, temRastreio: boolean): string | null {
  switch (h7Status) {
    case "posted_object":  return "postado";
    case "shipping":       return "em_transporte";
    case "waiting_client": return "aguardando_retirada";
    case "delivered":      return "entregue";
    case "returning":
    case "cancelled":      return "devolvido";
    case "paid":           return temRastreio ? "postado" : null;
    default:               return null;
  }
}

interface H7Order {
  code: string;
  status: string;
  is_upsell?: boolean;
  tracking_code?: string | null;
  shipping_company?: string | null;
  plan?: { qty?: number; name?: string };
  promised_date?: string | null;        // "YYYY-MM-DD" — prazo prometido pela H7
  delivered_at?: string | null;         // ISO — data de entrega confirmada
  last_hub_arrival?: string | null;     // ISO — última vez que chegou em uma base
  upsell?: H7Order[];                   // pedidos do mesmo carrinho (inclui o próprio principal)
}

interface H7Response {
  data?: H7Order[];
  total?: number;
  perPage?: number;
  page?: number;
  totals?: Record<string, number>;
}

interface PedidoRow {
  id: string;
  status: string;
  codigo_rastreio: string | null;
  chargeback: boolean;
  cliente_nome: string;
  cliente_telefone: string | null;
  payt_transaction_id: string;
}

async function runSync(startDate: string, endDate: string, enviarWhatsapp = true) {
  if (!H7_TOKEN) return { ok: false, erro: "H7_TOKEN não configurado" };

  const supabase = createServiceClient();

  console.log(`[sync-h7] iniciando sync: ${startDate} → ${endDate} (whatsapp=${enviarWhatsapp})`);

  let page = 1;
  let totalProcessados = 0;
  let totalAtualizados = 0;
  let totalWhatsapp = 0;
  const erros: string[] = [];

  while (true) {
    const url = `${H7_API_URL}?token=${H7_TOKEN}&startDate=${startDate}&endDate=${endDate}&page=${page}&perPage=${H7_PER_PAGE}`;

    let h7Data: H7Response;
    try {
      const res = await fetch(url);
      if (!res.ok) { erros.push(`H7 HTTP ${res.status} pág ${page}`); break; }
      h7Data = await res.json() as H7Response;
    } catch (e) {
      erros.push(`Erro H7: ${String(e)}`); break;
    }

    const orders: H7Order[] = h7Data.data ?? [];
    if (orders.length === 0) break;

    // A H7 só expõe o envio no pedido PRINCIPAL; upsells vêm aninhados em
    // order.upsell (mesmo carrinho, mesmo rastreio) e nunca aparecem como
    // pedido próprio na listagem. Achata para que upsells também casem por
    // payt_transaction_id, herdando rastreio e datas do principal.
    const itens: { ord: H7Order; principal: H7Order }[] = [];
    const vistos = new Set<string>();
    for (const principal of orders) {
      for (const ord of [principal, ...(principal.upsell ?? [])]) {
        if (!ord.code || vistos.has(ord.code)) continue;
        vistos.add(ord.code);
        itens.push({ ord, principal });
      }
    }

    // Buscar todos os pedidos desta página de uma vez
    const codes = itens.map(({ ord }) => ord.code);
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, status, codigo_rastreio, chargeback, cliente_nome, cliente_telefone, payt_transaction_id")
      .in("payt_transaction_id", codes);

    const pedidoMap = new Map<string, PedidoRow>(
      (pedidos ?? []).map((p) => [p.payt_transaction_id, p as PedidoRow])
    );

    // Verificar quais pedidos já têm disparo WhatsApp (batch) — só o principal
    // dispara: upsell compartilha o telefone e a encomenda.
    const idsParaCheckWpp = itens
      .filter(({ ord }) => ord.status === "waiting_client" && !ord.is_upsell)
      .map(({ ord }) => pedidoMap.get(ord.code)?.id)
      .filter(Boolean) as string[];

    let disparosExistentes = new Set<string>();
    if (idsParaCheckWpp.length > 0) {
      const { data: disparos } = await supabase
        .from("whatsapp_disparos")
        .select("pedido_id")
        .in("pedido_id", idsParaCheckWpp)
        .eq("tipo_mensagem", "aguardando_retirada");
      disparosExistentes = new Set((disparos ?? []).map((d) => d.pedido_id));
    }

    for (const { ord, principal } of itens) {
      totalProcessados++;

      const pedido = pedidoMap.get(ord.code);
      if (!pedido) continue;

      const trackingCode = ord.tracking_code ?? principal.tracking_code ?? null;
      const promisedDate = ord.promised_date ?? principal.promised_date ?? null;
      const deliveredAt  = ord.delivered_at ?? principal.delivered_at ?? null;
      const hubArrival   = ord.last_hub_arrival ?? principal.last_hub_arrival ?? null;

      const novoStatus = mapearStatusH7(ord.status, !!trackingCode);
      const isChargeback = ord.status === "chargeback";
      const updates: Record<string, unknown> = {};

      if (trackingCode && !pedido.codigo_rastreio) {
        updates.codigo_rastreio = trackingCode;
      }
      if (isChargeback && !pedido.chargeback) {
        updates.chargeback = true;
        updates.status_pagamento = "chargeback";
      }
      if (novoStatus) {
        const prioAtual = STATUS_PRIORIDADE[pedido.status] ?? 0;
        const prioNova = STATUS_PRIORIDADE[novoStatus] ?? 0;
        if (prioNova > prioAtual) {
          updates.status = novoStatus;
          if (novoStatus === "entregue") {
            updates.data_entrega = deliveredAt ?? new Date().toISOString();
          }
        }
      }

      // Capturar data prometida pela H7 (campo promised_date: "YYYY-MM-DD")
      if (promisedDate) {
        updates.data_prometida_entrega = promisedDate;
      }

      // Capturar data de chegada na base logística (campo last_hub_arrival)
      if (hubArrival) {
        updates.data_chegou_logistica = hubArrival;
      }

      if (Object.keys(updates).length === 0) continue;

      updates.updated_at = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("pedidos").update(updates).eq("id", pedido.id);

      if (updateErr) { erros.push(`Erro pedido ${ord.code}: ${updateErr.message}`); continue; }
      totalAtualizados++;

      // WhatsApp automático ao entrar em aguardando_retirada
      if (
        updates.status === "aguardando_retirada" &&
        enviarWhatsapp &&
        !ord.is_upsell &&
        pedido.cliente_telefone &&
        !disparosExistentes.has(pedido.id)
      ) {
        const codigoRastreio = trackingCode ?? pedido.codigo_rastreio ?? "N/A";

        const { data: novoDisparo } = await supabase
          .from("whatsapp_disparos")
          .insert({ pedido_id: pedido.id, tipo_mensagem: "aguardando_retirada", status: "pendente" })
          .select("id").single();

        const { sucesso, messageId, erro } = await enviarWhatsappAguardandoRetirada({
          telefone: pedido.cliente_telefone,
          nomeCliente: pedido.cliente_nome,
          codigoRastreio,
        });

        if (novoDisparo) {
          await supabase.from("whatsapp_disparos").update({
            status: sucesso ? "enviado" : "falhou",
            meta_message_id: messageId ?? null,
            erro_detalhes: erro ?? null,
            data_envio: new Date().toISOString(),
          }).eq("id", novoDisparo.id);
        }

        if (sucesso) totalWhatsapp++;
      }
    }

    const total = h7Data.total ?? 0;
    const perPage = h7Data.perPage ?? H7_PER_PAGE;
    if (total && page * perPage >= total) break;
    if (orders.length < perPage) break;
    page++;
  }

  console.log(`[sync-h7] concluído: ${totalProcessados} processados, ${totalAtualizados} atualizados, ${totalWhatsapp} WhatsApp`);

  return {
    ok: true,
    processados: totalProcessados,
    atualizados: totalAtualizados,
    whatsappEnviados: totalWhatsapp,
    erros: erros.length > 0 ? erros : undefined,
  };
}

function defaultDates(dias = 7) {
  const endDate = getTodayInAppTimezone();
  return {
    startDate: shiftDateString(endDate, -dias),
    endDate,
  };
}

function isAuthorized(req: NextRequest) {
  if (!INTERNAL_API_SECRET) return true;
  const header = req.headers.get("x-internal-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === INTERNAL_API_SECRET;
}

// GET — cron. Sem parâmetro cobre 7 dias; ?dias=N amplia a janela (varredura
// diária/backfill). Janela ampla NÃO dispara WhatsApp de retirada — backfill
// não deve mandar mensagem de encomenda antiga.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, erro: "unauthorized" }, { status: 401 });
  }
  const diasParam = Number(req.nextUrl.searchParams.get("dias"));
  const dias = Number.isFinite(diasParam) && diasParam >= 1 ? Math.min(diasParam, 120) : 7;
  const { startDate, endDate } = defaultDates(dias);
  console.log(`[sync-h7] cron trigger: ${startDate} → ${endDate}`);
  const result = await runSync(startDate, endDate, dias <= 7);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

// POST — chamado manualmente pelo dashboard com datas opcionais
export async function POST(req: NextRequest) {
  if (!isTrustedAppRequest(req)) {
    return NextResponse.json({ ok: false, erro: "forbidden" }, { status: 403 });
  }
  let startDate: string;
  let endDate: string;
  try {
    const body = await req.json().catch(() => ({})) as { startDate?: string; endDate?: string };
    const defaults = defaultDates(7);
    startDate = body.startDate ?? defaults.startDate;
    endDate = body.endDate ?? defaults.endDate;
  } catch {
    return NextResponse.json({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }
  const result = await runSync(startDate, endDate);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
