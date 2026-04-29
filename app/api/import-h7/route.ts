import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const H7_API_URL = process.env.H7_API_URL ?? "https://api.haga7digital.com.br/api/orders/fly";
const H7_TOKEN = process.env.H7_TOKEN ?? "";
const H7_PER_PAGE = 100;

// H7 status → status interno (para importação)
function mapearStatusH7(h7Status: string, temRastreio: boolean): string {
  switch (h7Status) {
    case "posted_object":  return "postado";
    case "shipping":       return "em_transporte";
    case "waiting_client": return "aguardando_retirada";
    case "delivered":      return "entregue";
    case "returning":
    case "cancelled":      return "devolvido";
    case "paid":           return temRastreio ? "postado" : "aguardando_postagem";
    case "chargeback":     return "aguardando_postagem";
    default:               return "aguardando_postagem";
  }
}

interface H7Customer {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  address_city?: string;
  address_compl?: string;
  address_district?: string;
  address_number?: string;
  address_state?: string;
  address_country?: string;
  zip_code?: string;
}

interface H7Order {
  code: string;
  status: string;
  value?: number;
  total_value?: number;
  tracking_code?: string | null;
  shipping_company?: string | null;
  transaction_created_at?: string;
  customer?: H7Customer;
  product?: { name?: string };
  plan?: { name?: string; qty?: number };
}

interface H7Response {
  data?: H7Order[];
  total?: number;
  perPage?: number;
}

export async function POST(req: NextRequest) {
  if (!H7_TOKEN) {
    return NextResponse.json({ ok: false, erro: "H7_TOKEN não configurado" }, { status: 500 });
  }

  const supabase = createServiceClient();

  let startDate: string;
  let endDate: string;
  try {
    const body = await req.json().catch(() => ({})) as { startDate?: string; endDate?: string };
    if (!body.startDate || !body.endDate) {
      return NextResponse.json({ ok: false, erro: "startDate e endDate obrigatórios" }, { status: 400 });
    }
    startDate = body.startDate;
    endDate = body.endDate;
  } catch {
    return NextResponse.json({ ok: false, erro: "JSON inválido" }, { status: 400 });
  }

  console.log(`[import-h7] importando: ${startDate} → ${endDate}`);

  let page = 1;
  let totalProcessados = 0;
  let totalInseridos = 0;
  let totalIgnorados = 0;
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
    totalProcessados += orders.length;

    // Verificar quais codes já existem no banco (batch)
    const codes = orders.map((o) => o.code).filter(Boolean);
    const { data: existentes } = await supabase
      .from("pedidos")
      .select("payt_transaction_id")
      .in("payt_transaction_id", codes);

    const codesExistentes = new Set((existentes ?? []).map((p) => p.payt_transaction_id));

    // Montar lote de pedidos novos
    const novos = orders
      .filter((o) => o.code && !codesExistentes.has(o.code))
      .map((order) => {
        const c = order.customer ?? {};
        const endereco = {
          logradouro: c.address,
          numero: c.address_number,
          complemento: c.address_compl,
          bairro: c.address_district,
          cidade: c.address_city,
          estado: c.address_state,
          cep: c.zip_code,
          pais: c.address_country,
        };

        return {
          payt_transaction_id: order.code,
          cliente_nome: c.name ?? "Desconhecido",
          cliente_email: c.email ?? null,
          cliente_telefone: c.phone ?? null,
          cliente_cpf: c.document ?? null,
          produto_nome: order.plan?.name ?? order.product?.name ?? null,
          produto_grupo: order.product?.name ?? null,
          qtd_potes: order.plan?.qty ?? null,
          valor_total: order.total_value ?? order.value ?? null,
          data_pagamento: order.transaction_created_at ?? null,
          endereco_entrega: endereco,
          codigo_rastreio: order.tracking_code ?? null,
          status: mapearStatusH7(order.status, !!order.tracking_code),
          status_pagamento: order.status === "chargeback" ? "chargeback" : "paid",
          chargeback: order.status === "chargeback",
          data_entrega: order.status === "delivered" ? order.transaction_created_at ?? null : null,
        };
      });

    totalIgnorados += orders.length - novos.length;

    if (novos.length > 0) {
      // Inserir em lote
      const { data: inseridos, error } = await supabase
        .from("pedidos")
        .insert(novos)
        .select("id");

      if (error) {
        erros.push(`Erro insert pág ${page}: ${error.message}`);
      } else {
        totalInseridos += inseridos?.length ?? 0;

        // Registrar movimentação de estoque para cada pedido inserido
        const movimentacoes = novos
          .filter((p) => p.produto_grupo && p.qtd_potes && p.qtd_potes > 0)
          .map((p, i) => ({
            produto_grupo: p.produto_grupo!,
            tipo: "venda",
            qtd_potes: p.qtd_potes!,
            referencia_pedido_id: inseridos?.[i]?.id ?? null,
            observacao: "Importado via H7",
          }));

        if (movimentacoes.length > 0) {
          await supabase.from("estoque_movimentacao").insert(movimentacoes);

          // Decrementar estoque por grupo
          const porGrupo = movimentacoes.reduce((acc, m) => {
            acc[m.produto_grupo] = (acc[m.produto_grupo] ?? 0) + m.qtd_potes;
            return acc;
          }, {} as Record<string, number>);

          for (const [grupo, qty] of Object.entries(porGrupo)) {
            await supabase.rpc("decrementar_estoque", { p_grupo: grupo, p_qtd: qty });
          }
        }
      }
    }

    // Paginação
    const total = h7Data.total ?? 0;
    const perPage = h7Data.perPage ?? H7_PER_PAGE;
    if (total && page * perPage >= total) break;
    if (orders.length < perPage) break;
    page++;
  }

  console.log(`[import-h7] concluído: ${totalProcessados} processados, ${totalInseridos} inseridos, ${totalIgnorados} ignorados`);

  return NextResponse.json({
    ok: true,
    processados: totalProcessados,
    inseridos: totalInseridos,
    ignorados: totalIgnorados,
    erros: erros.length > 0 ? erros : undefined,
  });
}
