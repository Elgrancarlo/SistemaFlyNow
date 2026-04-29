import { createServiceClient } from "@/lib/supabase";
import TabelaEstoque from "@/components/estoque/tabela-estoque";
import FormEntrada from "@/components/estoque/form-entrada";
import Shell from "@/components/shell";
import type { EstoqueGrupo, EstoqueMovimentacao } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getEstoque(): Promise<EstoqueGrupo[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("estoque_grupos")
    .select("id, nome_grupo, estoque_atual, created_at, updated_at")
    .order("nome_grupo");

  if (error) {
    console.error("Erro ao buscar estoque:", error);
    return [];
  }
  return data ?? [];
}

async function getMovimentacoes(): Promise<EstoqueMovimentacao[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("estoque_movimentacao")
    .select("id, produto_grupo, tipo, qtd_potes, referencia_pedido_id, observacao, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Erro ao buscar movimentações:", error);
    return [];
  }
  return data ?? [];
}

export default async function EstoquePage() {
  const [grupos, movimentacoes] = await Promise.all([getEstoque(), getMovimentacoes()]);

  const totalVendido = movimentacoes
    .filter((m) => m.tipo === "venda")
    .reduce((acc, m) => acc + m.qtd_potes, 0);

  const totalEntrada = movimentacoes
    .filter((m) => m.tipo === "entrada")
    .reduce((acc, m) => acc + m.qtd_potes, 0);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Estoque</h1>
            <p className="text-sm text-gray-500 mt-0.5">Controle por grupo de produto</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{totalEntrada.toLocaleString("pt-BR")}</div>
              <div className="text-gray-500">Potes entrada</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{totalVendido.toLocaleString("pt-BR")}</div>
              <div className="text-gray-500">Potes vendidos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Registrar Entrada de Estoque</h2>
          <FormEntrada grupos={grupos.map((g) => g.nome_grupo)} />
        </div>
        <TabelaEstoque grupos={grupos} movimentacoes={movimentacoes} />
      </div>
    </Shell>
  );
}
