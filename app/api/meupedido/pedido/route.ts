import { NextRequest, NextResponse } from "next/server";
import { detalhePedido } from "@/lib/meupedido/dados";
import { ipDaRequest, permitido } from "@/lib/meupedido/rate-limit";

// Rota PÚBLICA da página Meu Pedido: detalhe de um pedido.
// Exige CPF + código do pedido juntos — o código sozinho não abre nada.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!permitido(ipDaRequest(req.headers))) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  let body: { cpf?: string; codigo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const cpf = (body.cpf ?? "").replace(/\D/g, "");
  const codigo = (body.codigo ?? "").trim().toUpperCase();
  if (cpf.length !== 11 || !codigo || codigo.length > 20) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const pedido = await detalhePedido(cpf, codigo);
    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado para este CPF." }, { status: 404 });
    }
    return NextResponse.json({ pedido });
  } catch (e) {
    console.error("[meupedido/pedido] erro:", e);
    return NextResponse.json({ error: "Erro ao consultar. Tente novamente." }, { status: 500 });
  }
}
