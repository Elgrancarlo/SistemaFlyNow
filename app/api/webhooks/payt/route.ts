import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const PAYT_INTEGRATION_KEY = process.env.PAYT_INTEGRATION_KEY;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  // Validar chave de integração
  if (PAYT_INTEGRATION_KEY && body.integration_key !== PAYT_INTEGRATION_KEY) {
    return NextResponse.json({ ok: false, erro: "Unauthorized" }, { status: 401 });
  }

  const transactionId = body.transaction_id as string;
  const status = body.status as string; // paid | refunded | chargeback | charged_back

  if (!transactionId) {
    return NextResponse.json({ ok: false, erro: "transaction_id ausente" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // ── REEMBOLSO ──────────────────────────────────────────────────────────────
  if (status === "refunded") {
    const { data: existente } = await supabase
      .from("pedidos")
      .select("id")
      .eq("payt_transaction_id", transactionId)
      .single();

    if (existente) {
      await supabase
        .from("pedidos")
        .update({ status_pagamento: "refunded", updated_at: new Date().toISOString() })
        .eq("payt_transaction_id", transactionId);
      return NextResponse.json({ ok: true, evento: "refunded", id: existente.id });
    }
    return NextResponse.json({ ok: true, evento: "refunded", aviso: "pedido não encontrado" });
  }

  // ── CHARGEBACK ─────────────────────────────────────────────────────────────
  if (status === "chargeback" || status === "charged_back") {
    const { data: existente } = await supabase
      .from("pedidos")
      .select("id")
      .eq("payt_transaction_id", transactionId)
      .single();

    if (existente) {
      await supabase
        .from("pedidos")
        .update({
          chargeback: true,
          status_pagamento: "chargeback",
          updated_at: new Date().toISOString(),
        })
        .eq("payt_transaction_id", transactionId);
      return NextResponse.json({ ok: true, evento: "chargeback", id: existente.id });
    }
    return NextResponse.json({ ok: true, evento: "chargeback", aviso: "pedido não encontrado" });
  }

  // ── VENDA APROVADA ─────────────────────────────────────────────────────────
  if (status !== "paid") {
    return NextResponse.json({ ok: true, evento: "ignorado", status });
  }

  // Só processar pedidos físicos
  if (!body.tangible) {
    return NextResponse.json({ ok: true, evento: "ignorado", motivo: "not_tangible" });
  }

  const customer = body.customer as Record<string, unknown>;
  const product = body.product as Record<string, unknown>;
  const transaction = body.transaction as Record<string, unknown>;
  const shipping = body.shipping as Record<string, unknown>;

  // Extrair potes dos itens físicos
  const items = (product?.items as Array<Record<string, unknown>>) ?? [];
  const itensFisicos = items.filter((i) => i.type === "physical");
  const qtdPotes = itensFisicos.reduce((acc, i) => acc + ((i.quantity as number) ?? 0), 0);
  const produtoGrupo = (itensFisicos[0]?.name as string) ?? (product?.name as string) ?? null;
  const valorTotal = transaction?.total_price ? (transaction.total_price as number) / 100 : null;

  // Idempotência
  const { data: existente } = await supabase
    .from("pedidos")
    .select("id")
    .eq("payt_transaction_id", transactionId)
    .single();

  if (existente) {
    return NextResponse.json({ ok: true, evento: "ignorado", motivo: "already_exists", id: existente.id });
  }

  // Inserir pedido
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .insert({
      payt_transaction_id: transactionId,
      cliente_nome: customer?.name ?? "Desconhecido",
      cliente_email: customer?.email ?? null,
      cliente_telefone: customer?.phone ?? null,
      cliente_cpf: customer?.doc ?? null,
      produto_nome: product?.name ?? null,
      produto_grupo: produtoGrupo,
      qtd_potes: qtdPotes || null,
      valor_total: valorTotal,
      forma_pagamento: transaction?.payment_method ?? null,
      data_pagamento: transaction?.paid_at ?? null,
      endereco_entrega: (shipping?.address as Record<string, unknown>) ?? null,
      status: "aguardando_postagem",
      status_pagamento: "paid",
      chargeback: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[webhook-payt] Erro ao inserir:", error);
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
  }

  // Decrementar estoque
  if (produtoGrupo && qtdPotes > 0) {
    await supabase
      .from("estoque_grupos")
      .upsert({ nome_grupo: produtoGrupo }, { onConflict: "nome_grupo", ignoreDuplicates: true });

    await supabase.rpc("decrementar_estoque", { p_grupo: produtoGrupo, p_qtd: qtdPotes });

    await supabase.from("estoque_movimentacao").insert({
      produto_grupo: produtoGrupo,
      tipo: "venda",
      qtd_potes: qtdPotes,
      referencia_pedido_id: pedido!.id,
    });
  }

  return NextResponse.json({ ok: true, evento: "venda", id: pedido!.id });
}
