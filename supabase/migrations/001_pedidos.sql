-- Tabela principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payt_transaction_id  TEXT UNIQUE NOT NULL,
  cliente_nome         TEXT NOT NULL,
  cliente_email        TEXT,
  cliente_telefone     TEXT,
  cliente_cpf          TEXT,
  produto_nome         TEXT,
  produto_grupo        TEXT,
  qtd_potes            INTEGER,
  valor_total          NUMERIC(10, 2),
  forma_pagamento      TEXT,
  data_pagamento       TIMESTAMPTZ,
  endereco_entrega     JSONB,
  status               TEXT NOT NULL DEFAULT 'aguardando_postagem',
  -- aguardando_postagem | postado | em_transporte | aguardando_retirada | entregue | devolvido
  status_pagamento     TEXT,
  -- paid | refunded | chargeback
  chargeback           BOOLEAN NOT NULL DEFAULT FALSE,
  codigo_rastreio      TEXT,
  loggi_key            TEXT,
  data_entrega         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance nas queries mais comuns
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_produto_grupo ON pedidos (produto_grupo);
CREATE INDEX IF NOT EXISTS idx_pedidos_chargeback ON pedidos (chargeback);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo_rastreio ON pedidos (codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pagamento ON pedidos (data_pagamento DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar Realtime para o dashboard atualizar sem refresh
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
