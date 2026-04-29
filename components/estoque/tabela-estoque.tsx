"use client";

import { useState } from "react";
import type { EstoqueGrupo, EstoqueMovimentacao } from "@/lib/supabase";

interface TabelaEstoqueProps {
  grupos: EstoqueGrupo[];
  movimentacoes: EstoqueMovimentacao[];
}

export default function TabelaEstoque({ grupos, movimentacoes }: TabelaEstoqueProps) {
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null);

  const movimentacoesFiltradas = grupoSelecionado
    ? movimentacoes.filter((m) => m.produto_grupo === grupoSelecionado)
    : movimentacoes;

  return (
    <div className="space-y-4">
      {/* Saldo por grupo */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Saldo por Produto</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Produto</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Entradas</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Vendidos</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Saldo</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grupos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Nenhum grupo cadastrado ainda
                </td>
              </tr>
            ) : (
              grupos.map((grupo) => {
                const entradas = movimentacoes
                  .filter((m) => m.produto_grupo === grupo.nome_grupo && m.tipo === "entrada")
                  .reduce((acc, m) => acc + m.qtd_potes, 0);
                const vendidos = movimentacoes
                  .filter((m) => m.produto_grupo === grupo.nome_grupo && m.tipo === "venda")
                  .reduce((acc, m) => acc + m.qtd_potes, 0);

                return (
                  <tr key={grupo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{grupo.nome_grupo}</td>
                    <td className="px-6 py-3 text-right text-blue-700">
                      +{entradas.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-right text-orange-700">
                      -{vendidos.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          grupo.estoque_atual < 0 ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        {grupo.estoque_atual.toLocaleString("pt-BR")}
                      </span>
                      {grupo.estoque_atual < 0 && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          NEGATIVO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() =>
                          setGrupoSelecionado(
                            grupoSelecionado === grupo.nome_grupo ? null : grupo.nome_grupo
                          )
                        }
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        {grupoSelecionado === grupo.nome_grupo ? "Fechar" : "Ver extrato"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Extrato de movimentações */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Extrato de Movimentações
            {grupoSelecionado && (
              <span className="ml-2 text-sm font-normal text-indigo-600">
                — {grupoSelecionado}
              </span>
            )}
          </h2>
          {grupoSelecionado && (
            <button
              onClick={() => setGrupoSelecionado(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Ver todos
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Data</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Produto</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Potes</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Obs.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movimentacoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Nenhuma movimentação
                </td>
              </tr>
            ) : (
              movimentacoesFiltradas.slice(0, 100).map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{m.produto_grupo}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.tipo === "entrada"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {m.tipo === "entrada" ? "Entrada" : "Venda"}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-3 text-right font-medium ${
                      m.tipo === "entrada" ? "text-blue-700" : "text-orange-700"
                    }`}
                  >
                    {m.tipo === "entrada" ? "+" : "-"}
                    {m.qtd_potes.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{m.observacao ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
