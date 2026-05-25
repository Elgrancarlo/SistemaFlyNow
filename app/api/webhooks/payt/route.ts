import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { inferirGrupo } from "@/lib/produtos";

const PAYT_INTEGRATION_KEY = process.env.PAYT_INTEGRATION_KEY;

/** Lê chave dot-notation do payload flat da Payt: get(body, "customer.name") */
function get<T>(body: Record<string, unknown>, key: string): T | null {
  return (body[key] as T) ?? null;
}

/** Extrai todos os itens do produto do payload flat (product.items.0.*, product.items.1.*, ...) */
function extractItems(body: Record<string, unknown>): Array<{ name: string | null; type: string | null; quantity: number }> {
  const items = [];
  for (let i = 0; ; i++) {
    const type = get<string>(body, `product.items.${i}.type`);
    const name = get<string>(body, `product.items.${i}.name`);
    if (type === null && name === null) break;
    items.push({
      name,
      type,
      quantity: get<number>(body, `product.items.${i}.quantity`) ?? 0,
    });
  }
  return items;
}

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

  // Logar raw payload para auditoria (fire-and-forget)
  supabase.from("payt_webhooks_raw").insert({ payload: body }).then(({ error }) => {
    if (error) console.error("[webhook-payt] Erro ao logar raw:", error.message);
  });

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

  // Dados do cliente (flat dot-notation)
  const clienteNome     = get<string>(body, "customer.name") ?? "Desconhecido";
  const clienteEmail    = get<string>(body, "customer.email");
  const clienteTelefone = get<string>(body, "customer.phone");
  const clienteCpf      = get<string>(body, "customer.doc");

  // Dados do produto
  const produtoNome  = get<string>(body, "product.name");
  const items        = extractItems(body);
  const itensFisicos = items.filter((i) => i.type === "physical");
  const qtdPotes     = itensFisicos.reduce((acc, i) => acc + i.quantity, 0);
  const rawGrupo     = itensFisicos[0]?.name ?? produtoNome ?? null;
  const produtoGrupo = inferirGrupo(rawGrupo) ?? rawGrupo;

  // Transação
  const totalPriceCents = get<number>(body, "transaction.total_price");
  const valorTotal      = totalPriceCents ? totalPriceCents / 100 : null;
  const formaPagamento  = get<string>(body, "transaction.payment_method");
  const dataPagamento   = get<string>(body, "transaction.paid_at");
  const parcelas        = get<number>(body, "transaction.installments");
  const paytCartId      = (body.cart_id as string) ?? null;

  // Endereço de entrega
  const enderecoEntrega: Record<string, unknown> = {};
  for (const field of ["street", "street_number", "complement", "district", "city", "state", "zipcode", "country"]) {
    const val = get<string>(body, `shipping.address.${field}`);
    if (val) enderecoEntrega[field] = val;
  }

  console.log(`[webhook-payt] paid | ${transactionId} | ${clienteNome} | ${produtoNome} | ${qtdPotes} potes | R$${valorTotal}`);

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
      payt_cart_id:        paytCartId,
      cliente_nome:        clienteNome,
      cliente_email:       clienteEmail,
      cliente_telefone:    clienteTelefone,
      cliente_cpf:         clienteCpf,
      produto_nome:        produtoNome,
      produto_grupo:       produtoGrupo,
      qtd_potes:           qtdPotes > 0 ? qtdPotes : null,
      valor_total:         valorTotal,
      forma_pagamento:     formaPagamento,
      parcelas:            parcelas,
      data_pagamento:      dataPagamento,
      endereco_entrega:    Object.keys(enderecoEntrega).length > 0 ? enderecoEntrega : null,
      status:              "pago",
      status_pagamento:    "paid",
      chargeback:          false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[webhook-payt] Erro ao inserir:", error);
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
  }

  console.log(`[webhook-payt] Inserido: id=${pedido!.id}`);

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
