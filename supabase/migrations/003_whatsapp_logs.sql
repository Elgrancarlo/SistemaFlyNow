-- Log de todos os disparos de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_disparos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        UUID REFERENCES pedidos (id) ON DELETE CASCADE,
  tipo_mensagem    TEXT NOT NULL DEFAULT 'aguardando_retirada',
  -- aguardando_retirada | custom
  status           TEXT NOT NULL DEFAULT 'pendente',
  -- pendente | enviado | falhou | entregue | lido
  meta_message_id  TEXT,
  erro_detalhes    TEXT,
  data_envio       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_pedido ON whatsapp_disparos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status ON whatsapp_disparos (status);
