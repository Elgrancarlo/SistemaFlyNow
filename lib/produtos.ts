/**
 * Normalização canônica de grupos de produto.
 * Centralizado aqui para garantir consistência em todos os pontos de entrada:
 * webhook Payt, import Payt, import H7 e recalcular-estoque.
 */

export const GRUPO_MAP: Array<[RegExp, string]> = [
  [/gelatina\s*slim/i,  "Gelatina Slim"],
  [/gelatina\s*pink/i,  "Gelatina Pink"],
  [/glico\s*reset/i,    "Glico Reset"],
  [/glicosmart/i,       "GlicoSmart"],
  [/power\s*66/i,       "Power 66"],
  [/laxantril/i,        "Laxantril"],
  [/prostapower/i,      "ProstaPower"],
  [/prosta\s*power/i,   "ProstaPower"],
  [/soulsynk/i,         "Soulsynk"],
  [/diva\s*slim/i,      "Diva Slim"],
  [/duratril/i,         "Duratril"],
  [/coco\s*slim/i,      "Coco Slim"],
  [/alpen\s*slim/i,     "Alpen Slim"],
  [/insutril/i,         "Insutril"],
  [/sonuszen/i,         "Sonuszen"],
  [/glicorin/i,         "Glicorin"],
];

/**
 * Tenta normalizar um nome de produto para o grupo canônico.
 * Testa produto_nome e produto_grupo (nessa ordem) para máxima cobertura.
 * Retorna null se nenhum padrão for reconhecido.
 */
export function inferirGrupo(
  ...candidatos: Array<string | null | undefined>
): string | null {
  for (const nome of candidatos) {
    if (!nome) continue;
    for (const [re, grupo] of GRUPO_MAP) {
      if (re.test(nome)) return grupo;
    }
  }
  return null;
}
