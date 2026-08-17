import { NextRequest, NextResponse } from "next/server";
import { listarPedidosPorCpf } from "@/lib/meupedido/dados";
import { ipDaRequest, permitido } from "@/lib/meupedido/rate-limit";

// Rota PÚBLICA da página Meu Pedido: lista os pedidos de um CPF.
// POST (não GET) para o CPF não vazar em logs de acesso/proxy.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!permitido(ipDaRequest(req.headers))) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  let body: { cpf?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const cpf = (body.cpf ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) {
    return NextResponse.json({ error: "Informe um CPF válido (11 dígitos)." }, { status: 400 });
  }

  try {
    const pedidos = await listarPedidosPorCpf(cpf);
    return NextResponse.json({ pedidos });
  } catch (e) {
    console.error("[meupedido/lookup] erro:", e);
    return NextResponse.json({ error: "Erro ao consultar. Tente novamente." }, { status: 500 });
  }
}
