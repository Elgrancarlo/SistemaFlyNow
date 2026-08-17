import { PedidoView } from "@/components/meupedido/pedido-view";

// Next 16: params é Promise — precisa de await.
export default async function PaginaPedido({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <PedidoView codigo={codigo.toUpperCase()} />;
}
