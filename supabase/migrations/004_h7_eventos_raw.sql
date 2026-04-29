-- Log bruto de todos os eventos recebidos da H7/Loggi
-- Usado para descobrir empiricamente os códigos de status restantes
CREATE TABLE IF NOT EXISTS h7_eventos_raw (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code    TEXT,
  loggi_key        TEXT,
  status_code      TEXT,
  status_descricao TEXT,
  payload_raw      JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_h7_raw_tracking ON h7_eventos_raw (tracking_code);
CREATE INDEX IF NOT EXISTS idx_h7_raw_code ON h7_eventos_raw (status_code);
CREATE INDEX IF NOT EXISTS idx_h7_raw_created ON h7_eventos_raw (created_at DESC);
