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

// ── Status do pipeline de pedidos ─────────────────────────────────────────────
export type StatusPedido =
  | "pago"
  | "nota_fiscal"
  | "separacao"
  | "aguardando_postagem"
  | "postado"
  | "em_transporte"
  | "aguardando_retirada"
  | "entregue"
  | "devolvido";

export type StatusPagamento = "paid" | "refunded" | "chargeback";

export type Role = "admin" | "estoque" | "financeiro" | "atendimento";

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface Pedido {
  id: string;
  payt_transaction_id: string;
  payt_cart_id: string | null;
  ordem_pedido: number | null;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_cpf: string | null;
  produto_nome: string | null;
  produto_grupo: string | null;
  qtd_potes: number | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  parcelas: number | null;
  data_pagamento: string | null;
  endereco_entrega: Record<string, unknown> | null;
  status: StatusPedido;
  status_pagamento: StatusPagamento | null;
  chargeback: boolean;
  codigo_rastreio: string | null;
  loggi_key: string | null;
  data_entrega: string | null;
  data_prometida_entrega: string | null;
  data_chegou_logistica: string | null;
  nfc_numero: string | null;
  nfc_valor: number | null;
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

export interface UsuarioRole {
  id: string;
  user_id: string;
  role: Role;
  nome: string | null;
  created_at: string;
  updated_at: string;
}

// ── Labels e cores ────────────────────────────────────────────────────────────
export const STATUS_LABELS: Record<StatusPedido, string> = {
  pago:                "Pago",
  nota_fiscal:         "Nota Fiscal",
  separacao:           "Separação",
  aguardando_postagem: "Aguard. Postagem",
  postado:             "Postado",
  em_transporte:       "Em Trânsito",
  aguardando_retirada: "Saiu p/ Entrega",
  entregue:            "Entregue",
  devolvido:           "Devolvido",
};

export const STATUS_COLORS: Record<StatusPedido, string> = {
  pago:                "bg-emerald-100 text-emerald-800",
  nota_fiscal:         "bg-sky-100 text-sky-800",
  separacao:           "bg-violet-100 text-violet-800",
  aguardando_postagem: "bg-yellow-100 text-yellow-800",
  postado:             "bg-blue-100 text-blue-800",
  em_transporte:       "bg-purple-100 text-purple-800",
  aguardando_retirada: "bg-orange-100 text-orange-800",
  entregue:            "bg-green-100 text-green-800",
  devolvido:           "bg-red-100 text-red-800",
};

// Colunas do Kanban (em ordem do pipeline)
export const KANBAN_COLUNAS: Array<{
  status: StatusPedido;
  label: string;
  corHeader: string;
  corBadge: string;
  icone: string;
}> = [
  { status: "pago",                label: "Pago",             corHeader: "bg-emerald-500", corBadge: "bg-emerald-100 text-emerald-800", icone: "💳" },
  { status: "nota_fiscal",         label: "Nota Fiscal",      corHeader: "bg-sky-500",     corBadge: "bg-sky-100 text-sky-800",         icone: "📄" },
  { status: "separacao",           label: "Separação",        corHeader: "bg-violet-500",  corBadge: "bg-violet-100 text-violet-800",   icone: "📦" },
  { status: "aguardando_postagem", label: "Aguard. Postagem", corHeader: "bg-yellow-500",  corBadge: "bg-yellow-100 text-yellow-800",   icone: "⏳" },
  { status: "postado",             label: "Postado",          corHeader: "bg-blue-500",    corBadge: "bg-blue-100 text-blue-800",       icone: "✉️" },
  { status: "em_transporte",       label: "Em Trânsito",      corHeader: "bg-purple-500",  corBadge: "bg-purple-100 text-purple-800",   icone: "🚚" },
  { status: "aguardando_retirada", label: "Saiu p/ Entrega",  corHeader: "bg-orange-500",  corBadge: "bg-orange-100 text-orange-800",   icone: "🛵" },
];
