import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Pedido — Flynow",
  description: "Acompanhe seu pedido Flynow: status, rastreio e previsão de entrega.",
  robots: { index: false },
};

// Página pública (cliente final) — não herda nenhum chrome do painel interno.
export default function MeuPedidoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#faf6f0] text-stone-800">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-16">{children}</div>
    </div>
  );
}
