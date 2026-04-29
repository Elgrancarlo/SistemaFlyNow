-- Saldo atual por grupo de produto
CREATE TABLE IF NOT EXISTS estoque_grupos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_grupo     TEXT UNIQUE NOT NULL,
  estoque_atual  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER estoque_grupos_updated_at
  BEFORE UPDATE ON estoque_grupos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Histórico de movimentações (entradas e vendas)
CREATE TABLE IF NOT EXISTS estoque_movimentacao (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_grupo         TEXT NOT NULL,
  tipo                  TEXT NOT NULL CHECK (tipo IN ('entrada', 'venda')),
  qtd_potes             INTEGER NOT NULL,
  referencia_pedido_id  UUID REFERENCES pedidos (id) ON DELETE SET NULL,
  observacao            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estoque_mov_grupo ON estoque_movimentacao (produto_grupo);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_tipo ON estoque_movimentacao (tipo);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_created ON estoque_movimentacao (created_at DESC);
