import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { enviarWhatsappAguardandoRetirada } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { disparoId, pedidoId, telefone, nomeCliente, codigoRastreio } = body;

  if (!telefone || !nomeCliente || !codigoRastreio) {
    return NextResponse.json({ ok: false, erro: "Campos obrigatórios: telefone, nomeCliente, codigoRastreio" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Para envios manuais com pedidoId: criar registro de disparo
  let resolvedDisparoId = disparoId ?? null;
  if (pedidoId && !disparoId) {
    const { data: novoDisparo } = await supabase
      .from("whatsapp_disparos")
      .insert({
        pedido_id: pedidoId,
        tipo_mensagem: "aguardando_retirada",
        status: "pendente",
      })
      .select("id")
      .single();
    resolvedDisparoId = novoDisparo?.id ?? null;
  }

  const { sucesso, messageId, erro } = await enviarWhatsappAguardandoRetirada({
    telefone,
    nomeCliente,
    codigoRastreio,
  });

  // Atualizar status do disparo no banco
  if (resolvedDisparoId) {
    await supabase
      .from("whatsapp_disparos")
      .update({
        status: sucesso ? "enviado" : "falhou",
        meta_message_id: messageId ?? null,
        erro_detalhes: erro ?? null,
        data_envio: new Date().toISOString(),
      })
      .eq("id", resolvedDisparoId);
  }

  if (!sucesso) {
    return NextResponse.json({ ok: false, erro }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId });
}
