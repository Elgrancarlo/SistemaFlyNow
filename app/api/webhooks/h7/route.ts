import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Prioridade dos status — impede regressão (evento atrasado não volta status)
const STATUS_PRIORIDADE: Record<string, number> = {
  aguardando_postagem: 0,
  postado: 1,
  em_transporte: 2,
  aguardando_retirada: 3,
  entregue: 4,
  devolvido: 5,
};

// Mapeamento completo de códigos H7 → status interno
const STATUS_MAP: Record<string, string> = {
  "1":  "postado",
  "2":  "devolvido",       // Cancelado
  "5":  "entregue",        // Entregue
  "6":  "devolvido",       // Recusado pelo destinatário
  "7":  "devolvido",       // Devolução iniciada
  "8":  "devolvido",       // Devolvido
  "11": "em_transporte",   // Em rota
  "13": "em_transporte",   // Conferido
  "15": "em_transporte",   // Medido e pesado
  "16": "em_transporte",   // Saiu de uma base
  "17": "em_transporte",   // Chegou em uma base
  "18": "aguardando_retirada", // Destinatário ausente → aguarda retirada
  "21": "em_transporte",   // Endereço errado (mantém em transporte, problema operacional)
  "22": "em_transporte",   // Aguardando ação do remetente (idem)
};

interface PedidoAlvo {
  id: string;
  status: string | null;
  cliente_telefone: string | null;
  cliente_nome: string | null;
  codigo_rastreio: string | null;
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  // Suporte ao envelope n8n: [{headers, body, ...}]
  const eventos = Array.isArray(raw) ? raw : [raw];
  const supabase = createServiceClient();
  let processados = 0;
  let atualizados = 0;

  for (const evento of eventos) {
    // Extrair body H7 do envelope n8n
    const h7body = (evento as Record<string, unknown>).body ?? evento;
    const h7 = h7body as Record<string, unknown>;

    const trackingCode = (h7.trackingCode as string) ?? null;
    const loggiKey     = (h7.loggiKey as string) ?? null;
    const statusObj    = (h7.status as Record<string, unknown>) ?? {};
    const statusCode   = (statusObj.code as string) ?? null;
    const statusDesc   = (statusObj.highLevelStatus as string) ?? null;
    const updatedTime  = (statusObj.updatedTime as string) ?? null;

    // 1. Logar raw sempre
    await supabase.from("h7_eventos_raw").insert({
      tracking_code:    trackingCode,
      loggi_key:        loggiKey,
      status_code:      statusCode,
      status_descricao: statusDesc,
      payload_raw:      h7,
    });

    processados++;

    // 2. Mapear status
    const novoStatus = statusCode ? STATUS_MAP[statusCode] : null;
    if (!novoStatus || !trackingCode) {
      console.log(`[webhook-h7] sem mapeamento: code=${statusCode} tracking=${trackingCode}`);
      continue;
    }

    // 3. Buscar pedidos pelo código de rastreio ou loggi_key. Upsell compartilha
    //    o rastreio do pedido principal, então o mesmo evento pode pertencer a
    //    mais de uma linha — todas avançam juntas.
    let alvos: PedidoAlvo[] = [];

    const { data: porRastreio } = await supabase
      .from("pedidos")
      .select("id, status, cliente_telefone, cliente_nome, codigo_rastreio")
      .eq("codigo_rastreio", trackingCode);

    if (porRastreio && porRastreio.length > 0) {
      alvos = porRastreio as PedidoAlvo[];
    } else if (loggiKey) {
      const { data: porKey } = await supabase
        .from("pedidos")
        .select("id, status, cliente_telefone, cliente_nome, codigo_rastreio")
        .eq("loggi_key", loggiKey);
      if (porKey && porKey.length > 0) alvos = porKey as PedidoAlvo[];
    }

    if (alvos.length === 0) {
      console.log(`[webhook-h7] pedido não encontrado: tracking=${trackingCode}`);
      continue;
    }

    // 4. Capturar datas de entrega do payload H7
    // promisedDate vem como "YYYY-MM-DD" (campo raiz do payload H7)
    const promisedDate      = (h7.promisedDate as string) ?? null;
    // data_chegada_logistica: registrada quando status code = 17 ("Chegou em uma base")
    const chegouNaBase      = statusCode === "17";

    for (const [idx, pedido] of alvos.entries()) {
      // 5. Atualizar pedido
      const update: Record<string, unknown> = {
        loggi_key:  loggiKey,
        updated_at: new Date().toISOString(),
      };

      // Só avança status se a prioridade do novo for maior que o atual
      // (impede que eventos atrasados regridan o pedido)
      const prioAtual = STATUS_PRIORIDADE[pedido.status ?? ""] ?? -1;
      const prioNova  = STATUS_PRIORIDADE[novoStatus] ?? -1;
      if (prioNova > prioAtual) {
        update.status = novoStatus;
      }
      if (!pedido.codigo_rastreio && trackingCode) update.codigo_rastreio = trackingCode;
      if (novoStatus === "entregue" && updatedTime)  update.data_entrega = updatedTime;

      // Salva data prometida sempre que a H7 informar (pode atualizar)
      if (promisedDate) update.data_prometida_entrega = promisedDate;

      // Salva o momento em que chegou na base logística (primeira ocorrência)
      if (chegouNaBase && updatedTime) update.data_chegou_logistica = updatedTime;

      await supabase.from("pedidos").update(update).eq("id", pedido.id);
      atualizados++;

      console.log(`[webhook-h7] ${trackingCode} → ${novoStatus} (pedido ${pedido.id}) prometida=${promisedDate ?? "n/a"} chegouBase=${chegouNaBase}`);

      // 6. Disparar WhatsApp se chegou em aguardando_retirada (e ainda não era).
      //    Só na primeira linha — as demais são upsell do mesmo cliente/encomenda.
      if (idx === 0 && novoStatus === "aguardando_retirada" && pedido.status !== "aguardando_retirada" && pedido.cliente_telefone) {
        const { data: jaDisparado } = await supabase
          .from("whatsapp_disparos")
          .select("id")
          .eq("pedido_id", pedido.id)
          .eq("tipo_mensagem", "aguardando_retirada")
          .neq("status", "falhou")
          .single();

        if (!jaDisparado) {
          await supabase.from("whatsapp_disparos").insert({
            pedido_id:      pedido.id,
            tipo_mensagem:  "aguardando_retirada",
            status:         "pendente",
            data_envio:     new Date().toISOString(),
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, processados, atualizados });
}
