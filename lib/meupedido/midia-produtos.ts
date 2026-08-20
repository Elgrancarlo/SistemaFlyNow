// Mídia pública por produto — fotos, guia visual de preparo e materiais em PDF.
// Origem: pasta "PRODUTOS" do Drive (FLY LABS • Aplicativo pós-compra, ago/2026).
// Arquivos ficam em public/meupedido/{produtos,guias,materiais}/.
// Módulo puro e leve: pode ser importado direto em Client Components.

import { slugDoProduto } from "./conteudo-produtos";

export interface MaterialProduto {
  titulo: string;
  arquivo: string; // caminho público do PDF
}

export interface MidiaProduto {
  foto?: string; // foto/mockup do pote (quadrada)
  guia?: string; // guia visual de preparo da aba "Como usar" (retrato)
  materiais?: MaterialProduto[];
}

const MIDIA: Record<string, MidiaProduto> = {
  power66: {
    foto: "/meupedido/produtos/power66.webp",
    guia: "/meupedido/guias/power66.webp",
    materiais: [
      { titulo: "Protocolo Garanhão", arquivo: "/meupedido/materiais/power66/Protocolo-Garanhao.pdf" },
      { titulo: "Protocolo Titan", arquivo: "/meupedido/materiais/power66/Protocolo-Titan.pdf" },
      {
        titulo: "Protocolo Tropical — O Renascimento do Guerreiro Amazônico",
        arquivo: "/meupedido/materiais/power66/Protocolo-Tropical-O-Renascimento-do-Guerreiro-Amazonico.pdf",
      },
      {
        titulo: "Protocolo Eros — Saúde Masculina com Ciência e Natureza",
        arquivo: "/meupedido/materiais/power66/Protocolo-Eros-Saude-Masculina-com-Ciencia-e-Natureza.pdf",
      },
      { titulo: "O Código da Ereção de Aço", arquivo: "/meupedido/materiais/power66/O-Codigo-da-Erecao-de-Aco.pdf" },
      { titulo: "O Truque de 13 Segundos", arquivo: "/meupedido/materiais/power66/O-Truque-de-13-Segundos.pdf" },
      {
        titulo: "O Guia Definitivo para Potência e Vigor Masculino 50+",
        arquivo: "/meupedido/materiais/power66/O-Guia-Definitivo-para-Potencia-e-Vigor-Masculino-50.pdf",
      },
    ],
  },
  gelatidina: {
    foto: "/meupedido/produtos/gelatidina.webp",
    guia: "/meupedido/guias/gelatidina.webp",
    materiais: [
      {
        titulo: "Protocolo Cintura de Passarela",
        arquivo: "/meupedido/materiais/gelatidina/Protocolo-Cintura-de-Passarela.pdf",
      },
      { titulo: "Chá da Juventude", arquivo: "/meupedido/materiais/gelatidina/Cha-da-Juventude.pdf" },
      {
        titulo: "9 Receitas de Vinagre de Maçã",
        arquivo: "/meupedido/materiais/gelatidina/9-Receitas-Vinagre-de-Maca.pdf",
      },
    ],
  },
  dermabloom: {
    foto: "/meupedido/produtos/dermabloom.webp",
    // guia visual existente diverge do rótulo (1 scoop/100 ml vs 3 g/200 ml) —
    // fica fora até a arte ser corrigida; o texto da ficha segue o rótulo.
    materiais: [
      {
        titulo: "Manual da Juventude Celular",
        arquivo: "/meupedido/materiais/dermabloom/Manual-da-Juventude-Celular.pdf",
      },
      { titulo: "Ritual Noturno Chinês", arquivo: "/meupedido/materiais/dermabloom/Ritual-Noturno-Chines.pdf" },
      { titulo: "Chá da Juventude", arquivo: "/meupedido/materiais/dermabloom/Cha-da-Juventude-derma.pdf" },
    ],
  },
  glicocell: { foto: "/meupedido/produtos/glicocell.webp" },
  memoclear: { foto: "/meupedido/produtos/memoclear.webp" },
  laxantril: { foto: "/meupedido/produtos/laxantril.webp" },
};

export function midiaDoProduto(
  produtoNome: string | null,
  produtoGrupo: string | null
): MidiaProduto | null {
  const slug = slugDoProduto(produtoNome, produtoGrupo);
  if (!slug) return null;
  return MIDIA[slug] ?? null;
}
