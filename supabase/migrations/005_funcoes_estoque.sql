-- Funções RPC para manipular estoque atomicamente

CREATE OR REPLACE FUNCTION decrementar_estoque(p_grupo TEXT, p_qtd INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE estoque_grupos
  SET estoque_atual = estoque_atual - p_qtd,
      updated_at = NOW()
  WHERE nome_grupo = p_grupo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION incrementar_estoque(p_grupo TEXT, p_qtd INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE estoque_grupos
  SET estoque_atual = estoque_atual + p_qtd,
      updated_at = NOW()
  WHERE nome_grupo = p_grupo;
END;
$$ LANGUAGE plpgsql;
