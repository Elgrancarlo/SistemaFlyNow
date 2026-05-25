import { createServiceClient } from "@/lib/supabase";
import Shell from "@/components/shell";
import PageHeader from "@/components/page-header";
import CardMetrica from "@/components/dashboard/card-metrica";
import FunilPedidos from "@/components/dashboard/funil-pedidos";
import GraficoTendencia from "@/components/dashboard/grafico-tendencia";
import AlertasAtivos from "@/components/dashboard/alertas-ativos";
import { ShoppingBag, DollarSign, RefreshCw, TrendingDown, Truck, Bell, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createServiceClient();

  const hoje = new Date().toISOString().slice(0, 10);

  const [
    vendasHoje,
    emTransito,
    metricasHoje,
    tendencia,
    funil,
    atrasados,
  ] = await Promise.all([
    supabase.rpc("vendas_hoje"),
    supabase.rpc("pedidos_em_transito"),
    supabase.rpc("metricas_financeiras", {
      p_start: hoje + "T00:00:00Z",
      p_end: hoje + "T23:59:59Z",
    }),
    supabase.rpc("tendencia_30_dias"),
    supabase.rpc("funil_pedidos"),
    supabase.rpc("pedidos_atrasados"),
  ]);

  return {
    vendasHoje:  vendasHoje.data  as { count: number; valor: number } | null,
    emTransito:  emTransito.data  as { count: number; valor: number } | null,
    metricasHoje: metricasHoje.data as {
      chargebacks: number; valorChargebacks: number;
      reembolsos: number; valorReembolsos: number;
    } | null,
    tendencia: (tendencia.data ?? []) as Array<{ dia: string; receita: number; reembolsos: number }>,
    funil:     (funil.data ?? [])     as Array<{ status: string; total: number; valor: number }>,
    atrasados: (atrasados.data ?? []) as Array<{
      id: string; ordem_pedido: number | null; cliente_nome: string;
      produto_grupo: string | null; codigo_rastreio: string | null;
      data_prometida_entrega: string | null; status: string;
    }>,
  };
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const vendasCount = data.vendasHoje?.count ?? 0;
  const vendasValor = data.vendasHoje?.valor ?? 0;
  const emTransitoCount = data.emTransito?.count ?? 0;
  const reembolsosHoje = data.metricasHoje?.reembolsos ?? 0;
  const valorReembolsosHoje = data.metricasHoje?.valorReembolsos ?? 0;

  // Taxa de reembolso: reembolsos / vendas * 100
  const taxaReembolso =
    vendasCount > 0 ? ((reembolsosHoje / vendasCount) * 100).toFixed(1) : "0";

  // Receita líquida = vendas - reembolsos - chargebacks (do dia)
  const receitaLiquida =
    vendasValor -
    (data.metricasHoje?.valorReembolsos ?? 0) -
    (data.metricasHoje?.valorChargebacks ?? 0);

  return (
    <Shell>
      <PageHeader titulo="Dashboard" subtitulo="Métricas do dia atual" />
      <div className="px-6 pb-8 space-y-6">

        {/* Visão Geral */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Visão Geral</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CardMetrica
              titulo="Vendas Hoje"
              valor={fmt(vendasValor)}
              subtitulo={`${vendasCount} pedidos`}
              icone={<ShoppingBag size={18} />}
              cor="verde"
            />
            <CardMetrica
              titulo="Receita Líquida"
              valor={fmt(receitaLiquida)}
              subtitulo="vendas - devoluções"
              icone={<DollarSign size={18} />}
              cor="verde"
            />
            <CardMetrica
              titulo="Reembolsos Hoje"
              valor={fmt(valorReembolsosHoje)}
              subtitulo={`${reembolsosHoje} pedidos`}
              icone={<RefreshCw size={18} />}
              cor="vermelho"
            />
            <CardMetrica
              titulo="Taxa de Reembolso"
              valor={`${taxaReembolso}%`}
              subtitulo="últimos 30 dias"
              icone={<TrendingDown size={18} />}
              cor="laranja"
            />
          </div>
        </section>

        {/* Operacional */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Operacional</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <CardMetrica
              titulo="Em Trânsito"
              valor={emTransitoCount.toLocaleString("pt-BR")}
              subtitulo="pedidos em rota"
              icone={<Truck size={18} />}
              cor="azul"
            />
            <CardMetrica
              titulo="Alertas Ativos"
              valor={data.atrasados.length.toString()}
              subtitulo="requerem atenção"
              icone={<Bell size={18} />}
              cor={data.atrasados.length > 0 ? "laranja" : "default"}
            />
            <CardMetrica
              titulo="Carrinhos (24h)"
              valor="—"
              subtitulo="em desenvolvimento"
              icone={<ShoppingCart size={18} />}
              cor="default"
            />
          </div>
        </section>

        {/* Análise */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Análise de Pedidos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FunilPedidos dados={data.funil} />
            <GraficoTendencia dados={data.tendencia} />
          </div>
        </section>

        {/* Alertas */}
        <section>
          <AlertasAtivos pedidos={data.atrasados} />
        </section>

      </div>
    </Shell>
  );
}
