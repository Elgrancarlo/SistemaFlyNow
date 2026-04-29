// Supabase Edge Function — Webhook Payt (Vendas)
// Deploy: supabase functions deploy webhook-payt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PAYT_INTEGRATION_KEY = Deno.env.get("PAYT_INTEGRATION_KEY");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Verificar integration_key da Payt
  if (PAYT_INTEGRATION_KEY && body.integration_key !== PAYT_INTEGRATION_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Só processar pedidos físicos
  if (!body.tangible) {
    return new Response(JSON.stringify({ ok: true, skipped: "not_tangible" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const transactionId = body.transaction_id as string;
  const status = body.status as string;
  const customer = body.customer as Record<string, unknown>;
  const product = body.product as Record<string, unknown>;
  const transaction = body.transaction as Record<string, unknown>;
  const shipping = body.shipping as Record<string, unknown>;

  if (!transactionId) {
    return new Response("Missing transaction_id", { status: 400 });
  }

  // Extrair quantidade de potes dos itens físicos
  const items = (product?.items as Array<Record<string, unknown>>) ?? [];
  const itensFixicos = items.filter((i) => i.type === "physical");
  const qtdPotes = itensFixicos.reduce(
    (acc, i) => acc + ((i.quantity as number) ?? 0),
    0
  );
  const produtoGrupo =
    (itensFixicos[0]?.name as string) ?? (product?.name as string) ?? null;

  const valorTotal = transaction?.total_price
    ? (transaction.total_price as number) / 100
    : null;

  const isChargeback =
    status === "chargeback" || status === "charged_back";

  // Idempotência: verificar se já existe
  const { data: existente } = await supabase
    .from("pedidos")
    .select("id, chargeback")
    .eq("payt_transaction_id", transactionId)
    .single();

  if (existente) {
    // Chargeback: marcar flag + status_pagamento
    if (isChargeback) {
      await supabase
        .from("pedidos")
        .update({ chargeback: true, status_pagamento: "chargeback", updated_at: new Date().toISOString() })
        .eq("payt_transaction_id", transactionId);
    }
    // Reembolso: só atualizar status_pagamento (NÃO é chargeback)
    if (status === "refunded") {
      await supabase
        .from("pedidos")
        .update({ status_pagamento: "refunded", updated_at: new Date().toISOString() })
        .eq("payt_transaction_id", transactionId);
    }
    return new Response(
      JSON.stringify({ ok: true, skipped: "already_exists", id: existente.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Inserir novo pedido
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
      status_pagamento: status,
      chargeback: isChargeback,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao inserir pedido:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Se venda aprovada, decrementar estoque
  if (status === "paid" && produtoGrupo && qtdPotes > 0) {
    // Garantir que o grupo existe
    await supabase
      .from("estoque_grupos")
      .upsert({ nome_grupo: produtoGrupo }, { onConflict: "nome_grupo", ignoreDuplicates: true });

    // Decrementar saldo
    await supabase.rpc("decrementar_estoque", {
      p_grupo: produtoGrupo,
      p_qtd: qtdPotes,
    });

    // Registrar movimentação
    await supabase.from("estoque_movimentacao").insert({
      produto_grupo: produtoGrupo,
      tipo: "venda",
      qtd_potes: qtdPotes,
      referencia_pedido_id: pedido!.id,
    });
  }

  return new Response(JSON.stringify({ ok: true, id: pedido!.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
