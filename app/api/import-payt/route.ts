import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { mapPaytToRow, type PaytTransaction } from "@/lib/payt";

const CHUNK = 100; // pedidos por lote de INSERT

export async function POST(req: NextRequest) {
  let body: { pedidos: PaytTransaction[]; dry_run?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  const { pedidos: input = [], dry_run = false } = body;

  if (!Array.isArray(input) || input.length === 0) {
    return NextResponse.json({ ok: false, erro: "Campo 'pedidos' deve ser um array não vazio" }, { status: 400 });
  }

  console.log(`[import-payt] recebidos: ${input.length} | dry_run: ${dry_run}`);

  // 1. Filtrar somente físicos e com transaction_id
  const validos = input.filter((tx) => tx.transaction_id && tx.tangible !== false);

  // 2. Verificar idempotência em lote
  const supabase = createServiceClient();
  const ids = validos.map((tx) => tx.transaction_id);

  const { data: existentes } = await supabase
    .from("pedidos")
    .select("payt_transaction_id")
    .in("payt_transaction_id", ids);

  const existentesSet = new Set((existentes ?? []).map((p) => p.payt_transaction_id));

  const novos = validos
    .filter((tx) => !existentesSet.has(tx.transaction_id))
    .map(mapPaytToRow);

  const ignorados = input.length - novos.length;

  console.log(`[import-payt] novos: ${novos.length} | ignorados: ${ignorados}`);

  if (dry_run) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      processados: input.length,
      seriam_inseridos: novos.length,
      ignorados,
      amostra: novos.slice(0, 3),
    });
  }

  // 3. INSERT em lotes de 100
  let totalInseridos = 0;
  const erros: string[] = [];

  for (let i = 0; i < novos.length; i += CHUNK) {
    const lote = novos.slice(i, i + CHUNK);
    const { data: inseridos, error } = await supabase
      .from("pedidos")
      .insert(lote)
      .select("id");

    if (error) {
      erros.push(`Lote ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
      console.error(`[import-payt] erro lote ${i}:`, error);
    } else {
      totalInseridos += inseridos?.length ?? 0;
    }
  }

  console.log(`[import-payt] concluído: ${totalInseridos} inseridos, ${erros.length} erros`);

  return NextResponse.json({
    ok: erros.length === 0,
    processados: input.length,
    inseridos: totalInseridos,
    ignorados,
    ...(erros.length > 0 && { erros }),
  });
}
