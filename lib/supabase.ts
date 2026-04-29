import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side: usa anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side: usa service role (bypass RLS)
export function createServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Tipos do banco
export type StatusPedido =
  | "aguardando_postagem"
  | "postado"
  | "em_transporte"
  | "aguardando_retirada"
  | "entregue"
  | "devolvido";

export type StatusPagamento = "paid" | "refunded" | "chargeback";

export interface Pedido {
  id: string;
  payt_transaction_id: string;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_cpf: string | null;
  produto_nome: string | null;
  produto_grupo: string | null;
  qtd_potes: number | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  data_pagamento: string | null;
  endereco_entrega: Record<string, unknown> | null;
  status: StatusPedido;
  status_pagamento: StatusPagamento | null;
  chargeback: boolean;
  codigo_rastreio: string | null;
  loggi_key: string | null;
  data_entrega: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstoqueGrupo {
  id: string;
  nome_grupo: string;
  estoque_atual: number;
  created_at: string;
  updated_at: string;
}

export interface EstoqueMovimentacao {
  id: string;
  produto_grupo: string;
  tipo: "entrada" | "venda";
  qtd_potes: number;
  referencia_pedido_id: string | null;
  observacao: string | null;
  created_at: string;
}

export interface WhatsappDisparo {
  id: string;
  pedido_id: string;
  tipo_mensagem: string;
  status: "pendente" | "enviado" | "falhou" | "entregue" | "lido";
  meta_message_id: string | null;
  erro_detalhes: string | null;
  data_envio: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<StatusPedido, string> = {
  aguardando_postagem: "Aguardando Postagem",
  postado: "Postado",
  em_transporte: "Em Transporte",
  aguardando_retirada: "Aguardando Retirada",
  entregue: "Entregue",
  devolvido: "Devolvido",
};

export const STATUS_COLORS: Record<StatusPedido, string> = {
  aguardando_postagem: "bg-yellow-100 text-yellow-800",
  postado: "bg-blue-100 text-blue-800",
  em_transporte: "bg-purple-100 text-purple-800",
  aguardando_retirada: "bg-orange-100 text-orange-800",
  entregue: "bg-green-100 text-green-800",
  devolvido: "bg-red-100 text-red-800",
};
