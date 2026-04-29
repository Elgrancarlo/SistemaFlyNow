import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { produto_grupo, qtd_potes, observacao } = body;

  if (!produto_grupo || !qtd_potes || qtd_potes <= 0) {
    return NextResponse.json({ ok: false, erro: "produto_grupo e qtd_potes são obrigatórios" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Garantir que o grupo existe
  await supabase
    .from("estoque_grupos")
    .upsert({ nome_grupo: produto_grupo }, { onConflict: "nome_grupo", ignoreDuplicates: true });

  // Incrementar saldo
  const { error: rpcError } = await supabase.rpc("incrementar_estoque", {
    p_grupo: produto_grupo,
    p_qtd: qtd_potes,
  });

  if (rpcError) {
    console.error("Erro ao incrementar estoque:", rpcError);
    return NextResponse.json({ ok: false, erro: rpcError.message }, { status: 500 });
  }

  // Registrar movimentação
  const { error: movError } = await supabase.from("estoque_movimentacao").insert({
    produto_grupo,
    tipo: "entrada",
    qtd_potes,
    observacao: observacao ?? null,
  });

  if (movError) {
    console.error("Erro ao registrar movimentação:", movError);
    return NextResponse.json({ ok: false, erro: movError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
