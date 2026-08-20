"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, ShieldCheck } from "lucide-react";
import { midiaDoProduto } from "@/lib/meupedido/midia-produtos";

interface PedidoResumo {
  codigo: string;
  produto: string;
  valor_total: number | null;
  status: string;
  data_pagamento: string | null;
  tem_rastreio: boolean;
}

const STATUS_CLIENTE: Record<string, { label: string; cls: string }> = {
  pago: { label: "Confirmado", cls: "bg-amber-100 text-amber-800" },
  nota_fiscal: { label: "Preparando", cls: "bg-amber-100 text-amber-800" },
  separacao: { label: "Preparando", cls: "bg-amber-100 text-amber-800" },
  aguardando_postagem: { label: "Preparando envio", cls: "bg-amber-100 text-amber-800" },
  postado: { label: "Postado", cls: "bg-sky-100 text-sky-800" },
  em_transporte: { label: "Em trânsito", cls: "bg-orange-100 text-orange-800" },
  aguardando_retirada: { label: "Aguardando retirada", cls: "bg-purple-100 text-purple-800" },
  entregue: { label: "Entregue", cls: "bg-emerald-100 text-emerald-800" },
  devolvido: { label: "Devolvido", cls: "bg-red-100 text-red-700" },
};

function formatCpfInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function dataBR(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

function valorBRL(v: number | null): string {
  if (v == null) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MeuPedidoHome() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null);

  // Volta direto pra lista se o cliente já se identificou nesta sessão
  useEffect(() => {
    const salvo = sessionStorage.getItem("meupedido_cpf");
    if (salvo) {
      setCpf(formatCpfInput(salvo));
      void buscar(salvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscar(cpfDigits?: string) {
    const digits = (cpfDigits ?? cpf).replace(/\D/g, "");
    if (digits.length !== 11) {
      setErro("Digite o CPF completo (11 dígitos).");
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/meupedido/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao consultar.");
        setPedidos(null);
        return;
      }
      sessionStorage.setItem("meupedido_cpf", digits);
      setPedidos(data.pedidos);
      if (data.pedidos.length === 1) {
        router.push(`/meupedido/${data.pedidos[0].codigo}`);
      }
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="pt-10 pb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/25">
          <Package className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Meu Pedido</h1>
        <p className="mt-1 text-sm text-stone-500">
          Acompanhe a entrega do seu pedido Flynow
        </p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
        <label htmlFor="cpf" className="mb-1.5 block text-sm font-medium text-stone-700">
          CPF usado na compra
        </label>
        <input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(formatCpfInput(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-lg tracking-wider text-stone-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
        />
        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
        <button
          onClick={() => buscar()}
          disabled={carregando}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
        >
          <Search className="h-4 w-4" aria-hidden />
          {carregando ? "Buscando..." : "Localizar meu pedido"}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Consulta segura — usamos o CPF só para localizar sua compra
        </p>
      </section>

      {pedidos !== null && (
        <section className="mt-6">
          {pedidos.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-900/5">
              <p className="font-medium text-stone-800">Nenhum pedido encontrado</p>
              <p className="mt-1 text-sm text-stone-500">
                Confira se o CPF é o mesmo usado na compra. Precisando de ajuda, escreva para{" "}
                <a className="font-medium text-orange-700 underline" href="mailto:flylabs@flylabssuporte.com">
                  flylabs@flylabssuporte.com
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 px-1 text-sm font-semibold text-stone-500">
                {pedidos.length === 1 ? "Seu pedido" : `Seus pedidos (${pedidos.length})`}
              </h2>
              <ul className="space-y-3">
                {pedidos.map((p) => {
                  const st = STATUS_CLIENTE[p.status] ?? { label: p.status, cls: "bg-stone-100 text-stone-700" };
                  const foto = midiaDoProduto(p.produto, null)?.foto;
                  return (
                    <li key={p.codigo}>
                      <button
                        onClick={() => router.push(`/meupedido/${p.codigo}`)}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-900/5 transition hover:ring-orange-500/40"
                      >
                        {foto ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={foto}
                            alt={p.produto}
                            width={44}
                            height={44}
                            className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain ring-1 ring-stone-900/5"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <Package className="h-5 w-5" aria-hidden />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-900">{p.produto}</p>
                          <p className="text-xs text-stone-500">
                            Pedido #{p.codigo}
                            {p.data_pagamento ? ` · ${dataBR(p.data_pagamento)}` : ""}
                            {p.valor_total != null ? ` · ${valorBRL(p.valor_total)}` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
