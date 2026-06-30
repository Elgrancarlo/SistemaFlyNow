-- Adiciona coluna valor_vendido_2 (purchase + upsell) do RedTrack
ALTER TABLE analytics.redtrack_daily_campaign
  ADD COLUMN IF NOT EXISTS valor_vendido_2 NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Atualiza view para incluir valor_vendido_2
CREATE OR REPLACE VIEW analytics.v_redtrack_resumo_diario AS
SELECT
  day,
  COALESCE(rt_source, source, 'OUTROS') AS source_bucket,
  SUM(clicks) AS clicks,
  SUM(conversions) AS conversions,
  SUM(cost) AS cost,
  SUM(revenue) AS revenue,
  SUM(total_revenue) AS total_revenue,
  SUM(valor_vendido_2) AS valor_vendido_2
FROM analytics.redtrack_daily_campaign
GROUP BY day, COALESCE(rt_source, source, 'OUTROS')
ORDER BY day DESC, SUM(cost) DESC;
