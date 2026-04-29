-- Índices para acelerar as queries mais frequentes

CREATE INDEX IF NOT EXISTS idx_pedidos_status
  ON pedidos(status);

CREATE INDEX IF NOT EXISTS idx_pedidos_created_at
  ON pedidos(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_status_pagamento
  ON pedidos(status_pagamento);

CREATE INDEX IF NOT EXISTS idx_pedidos_chargeback
  ON pedidos(chargeback) WHERE chargeback = TRUE;

-- Função: contagem por status (substitui 6 queries paralelas por 1)
CREATE OR REPLACE FUNCTION contagem_por_status()
RETURNS TABLE(status TEXT, total BIGINT)
LANGUAGE SQL STABLE
AS $$
  SELECT status, COUNT(*) AS total
  FROM pedidos
  GROUP BY status;
$$;

-- Função: métricas financeiras agregadas (sem buscar todas as linhas)
CREATE OR REPLACE FUNCTION metricas_financeiras()
RETURNS JSON
LANGUAGE SQL STABLE
AS $$
  SELECT json_build_object(
    'chargebacks',       COUNT(*) FILTER (WHERE chargeback = TRUE AND status_pagamento = 'chargeback'),
    'valorChargebacks',  COALESCE(SUM(valor_total) FILTER (WHERE chargeback = TRUE AND status_pagamento = 'chargeback'), 0),
    'reembolsos',        COUNT(*) FILTER (WHERE status_pagamento = 'refunded'),
    'valorReembolsos',   COALESCE(SUM(valor_total) FILTER (WHERE status_pagamento = 'refunded'), 0)
  )
  FROM pedidos;
$$;
