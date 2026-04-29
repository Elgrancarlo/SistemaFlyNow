-- RPCs com filtro de data para que os cards respeitem o período selecionado

CREATE OR REPLACE FUNCTION contagem_por_status(
  p_start TIMESTAMPTZ,
  p_end   TIMESTAMPTZ
)
RETURNS TABLE(status TEXT, total BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT status, COUNT(*) AS total
  FROM pedidos
  WHERE data_pagamento >= p_start
    AND data_pagamento <= p_end
  GROUP BY status;
$$;

CREATE OR REPLACE FUNCTION metricas_financeiras(
  p_start TIMESTAMPTZ,
  p_end   TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE SQL STABLE AS $$
  SELECT json_build_object(
    'chargebacks',      COUNT(*) FILTER (WHERE chargeback = TRUE AND status_pagamento = 'chargeback'),
    'valorChargebacks', COALESCE(SUM(valor_total) FILTER (WHERE chargeback = TRUE AND status_pagamento = 'chargeback'), 0),
    'reembolsos',       COUNT(*) FILTER (WHERE status_pagamento = 'refunded'),
    'valorReembolsos',  COALESCE(SUM(valor_total) FILTER (WHERE status_pagamento = 'refunded'), 0)
  )
  FROM pedidos
  WHERE data_pagamento >= p_start
    AND data_pagamento <= p_end;
$$;

-- Índice para acelerar filtros por data_pagamento (se ainda não existir)
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pagamento
  ON pedidos(data_pagamento DESC);
