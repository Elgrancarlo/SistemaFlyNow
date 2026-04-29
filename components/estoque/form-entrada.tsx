"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormEntradaProps {
  grupos: string[];
}

export default function FormEntrada({ grupos }: FormEntradaProps) {
  const router = useRouter();
  const [grupo, setGrupo] = useState("");
  const [novoGrupo, setNovoGrupo] = useState("");
  const [qtd, setQtd] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const grupoFinal = grupo === "__novo__" ? novoGrupo.trim() : grupo;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!grupoFinal || !qtd || Number(qtd) <= 0) {
      setErro("Informe o produto e a quantidade.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/estoque/entrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_grupo: grupoFinal,
          qtd_potes: Number(qtd),
          observacao: obs || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.erro ?? "Erro desconhecido");

      setGrupo("");
      setNovoGrupo("");
      setQtd("");
      setObs("");
      router.refresh();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar entrada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Produto</label>
        <select
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
          required
        >
          <option value="">Selecionar produto...</option>
          {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
          <option value="__novo__">+ Novo produto</option>
        </select>
      </div>

      {grupo === "__novo__" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Nome do produto</label>
          <input
            type="text"
            value={novoGrupo}
            onChange={(e) => setNovoGrupo(e.target.value)}
            placeholder="Ex: GlicoRESET"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Qtd potes</label>
        <input
          type="number"
          value={qtd}
          onChange={(e) => setQtd(e.target.value)}
          min="1"
          placeholder="0"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Observação (opcional)</label>
        <input
          type="text"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ex: NF 12345"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Salvando..." : "Registrar Entrada"}
      </button>

      {erro && <p className="text-sm text-red-600 w-full">{erro}</p>}
    </form>
  );
}
