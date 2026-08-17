// Nome de exibição do produto para o cliente final.
// O produto_nome do banco carrega nomenclatura interna de operação —
// "UPSELL GELATIDINA 6 POTES - (Televendas)", "GELATINA SLIM 6 POTES - UPSELL (R$397,00)",
// "(ASVI)", e o typo "UPLSSEL". Aqui vira "Gelatidina · 6 potes · pedido adicional".

// Grafias de marca que o title-case sozinho erraria.
const MARCAS: Record<string, string> = {
  PROSTAPOWER: "ProstaPower",
  "GHK-CU": "GHK-Cu",
  SOULSYNK: "SoulSynk",
  VIP: "VIP",
};

// Palavras que ficam minúsculas no meio do nome.
const MINUSCULAS = new Set(["de", "da", "do", "e", "em", "com", "para"]);
// Unidades de kit ficam minúsculas ("6 potes", "3 frascos").
const UNIDADES = new Set([
  "pote", "potes", "frasco", "frascos", "unidade", "unidades", "un", "kit", "caps", "cap",
]);

function titleCase(palavra: string): string {
  const upper = palavra.toUpperCase();
  if (MARCAS[upper]) return MARCAS[upper];
  const lower = palavra.toLowerCase();
  if (UNIDADES.has(lower) || MINUSCULAS.has(lower)) return lower;
  if (/^\d/.test(palavra)) return lower; // números e "30ml"
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function nomeExibicaoProduto(nomeBruto: string | null, grupo: string | null): string {
  let nome = (nomeBruto ?? grupo ?? "Pedido").trim();

  // upsell (em qualquer grafia, incluindo o typo UPLSSEL) vira sufixo amigável
  const ehUpsell = /\bUPSE?LL\b|\bUPLSSEL\b/i.test(nome);

  nome = nome
    .replace(/\bUPSE?LL\b|\bUPLSSEL\b/gi, " ")
    .replace(/\(?\s*televendas\s*\)?/gi, " ")
    .replace(/\(\s*asvi\s*\)/gi, " ")
    .replace(/\(?\s*R\$\s*[\d.,]+\s*\)?/gi, " ") // preços com R$
    .replace(/\b\d{1,4},\d{2}\b/g, " ") // preços sem R$ ("19,90") — nomes não usam vírgula decimal
    .replace(/\(\s*\)/g, " ") // parênteses que ficaram vazios
    .replace(/[()]/g, " ") // parênteses remanescentes de marcações internas
    .replace(/\s*[-–—]+\s*(?=$|[-–—])/g, " ") // traços órfãos no fim
    .replace(/\s+[-–—]\s*$/g, " ")
    .replace(/^\s*[-–—]\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[-–—\s]+|[-–—\s]+$/g, "");

  if (!nome) nome = (grupo ?? "Pedido").trim();

  // "GELATIDINA 6 POTES" → separa marca do kit: "Gelatidina · 6 potes"
  const kit = nome.match(/^(.*?)\s+[-–—]?\s*(\d+\s+(?:potes?|frascos?|unidades?|un|caps?)\b.*)$/i);
  let principal = nome;
  let sufixoKit = "";
  if (kit && kit[1].trim()) {
    principal = kit[1]
      .replace(/\bkit\b/gi, "")
      .replace(/[-–—\s]+$/g, "")
      .trim();
    sufixoKit = kit[2].trim();
  }
  if (!principal) principal = nome;

  const partes = [
    principal.split(/\s+/).map(titleCase).join(" "),
    sufixoKit ? sufixoKit.split(/\s+/).map(titleCase).join(" ") : "",
    ehUpsell ? "pedido adicional" : "",
  ].filter(Boolean);

  return partes.join(" · ");
}
