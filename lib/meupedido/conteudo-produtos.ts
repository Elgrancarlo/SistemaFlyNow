// Conteúdo público da aba "Como usar" — curado a partir dos briefings SAC
// (doc 03_produto_e_uso de cada produto). Versão segura para o cliente final:
// só uso, rotina e avisos; nada de material interno de atendimento.
// Produto sem entrada aqui cai no fallback genérico da página.

export interface ConteudoProduto {
  slug: string;
  nome: string;
  categoria: string;
  descricao: string;
  uso: { rotulo: string; valor: string }[];
  dicas: string[];
  avisos: string[];
}

const AVISO_PADRAO =
  "Este produto não é medicamento e não substitui orientação, diagnóstico ou tratamento médico.";
const AVISO_MEDICACAO =
  "Nunca interrompa ou substitua uma medicação prescrita por conta própria — converse sempre com o seu médico.";

export const CONTEUDO_PRODUTOS: ConteudoProduto[] = [
  {
    slug: "power66",
    nome: "Power 66",
    categoria: "Suplemento em pó — energia e bem-estar masculino",
    descricao:
      "Suplemento natural em pó que apoia, de forma gradual, a disposição e o bem-estar masculino. O resultado vem com a regularidade e varia de pessoa para pessoa.",
    uso: [
      { rotulo: "Dose", valor: "1 dose por dia" },
      { rotulo: "Preparo", valor: "Dissolver em água (cerca de 30 segundos)" },
      { rotulo: "Melhor horário", valor: "Preferencialmente pela manhã" },
      {
        rotulo: "Duração",
        valor: "Uso contínuo de pelo menos 90 dias; protocolo completo de ~150 dias (5 potes)",
      },
    ],
    dicas: [
      "Tome todos os dias — a constância é o que constrói o efeito.",
      "Os primeiros sinais são sutis (mais disposição); dê tempo ao protocolo.",
      "Não interrompa nas primeiras semanas achando que \"não funcionou\".",
    ],
    avisos: [AVISO_PADRAO],
  },
  {
    slug: "gelatidina",
    nome: "Gelatidina",
    categoria: "Suplemento em pó — saciedade e equilíbrio",
    descricao:
      "Fórmula natural em pó à base de gelatina e fibras (psyllium, linhaça e chia) que apoia os sinais naturais de fome e saciedade do corpo. Processo gradual, que depende de regularidade.",
    uso: [
      { rotulo: "Dose", valor: "1 dose por dia" },
      { rotulo: "Preparo", valor: "Preparo rápido, como uma gelatina (cerca de 30 segundos)" },
      { rotulo: "Melhor horário", valor: "Antes de dormir" },
      { rotulo: "Duração", valor: "Uso contínuo; recomendado de 3 a 6 meses para resultados mais consistentes" },
    ],
    dicas: [
      "Use todos os dias, sem pular — o efeito é acumulativo.",
      "Evite combinar com dietas extremas.",
      "Roupas mais folgadas e menos inchaço costumam vir antes da balança.",
    ],
    avisos: [AVISO_PADRAO],
  },
  {
    slug: "dermabloom",
    nome: "DermaBloom",
    categoria: "Suplemento em pó — beleza e saúde da pele",
    descricao:
      "Fórmula natural em pó que apoia, de forma gradual, a saúde e a aparência da pele. O resultado depende de regularidade e varia de pessoa para pessoa.",
    uso: [
      { rotulo: "Dose", valor: "1 dose por dia (igual para todas as idades)" },
      { rotulo: "Preparo", valor: "Dissolver em água (cerca de 30 segundos)" },
      { rotulo: "Melhor horário", valor: "Preferencialmente à noite, antes de dormir" },
      { rotulo: "Duração", valor: "30 a 90 dias para perceber resposta; tratamento completo de 6 meses" },
    ],
    dicas: [
      "A constância diária é o que faz diferença — não pule dias.",
      "Os primeiros sinais são sutis: pele mais hidratada e com mais viço.",
      "Sono, alimentação e protetor solar ajudam muito no resultado.",
    ],
    avisos: [AVISO_PADRAO, "Não substitui procedimentos estéticos nem tratamento dermatológico."],
  },
  {
    slug: "gelatina31",
    nome: "Gelatina 31",
    categoria: "Pó solúvel — suporte à saúde e aparência da pele",
    descricao:
      "Pó solúvel de uso diário voltado ao suporte da saúde e aparência da pele, com foco em rotina e regularidade. A resposta é individual e gradual.",
    uso: [
      { rotulo: "Dose", valor: "Uso diário, conforme instruções do rótulo" },
      { rotulo: "Preparo", valor: "Pó solúvel — siga o modo de preparo do rótulo" },
    ],
    dicas: [
      "Use de forma regular, sem pular dias.",
      "Não dobre a dose por conta própria.",
      "Dê tempo ao produto — interromper cedo é o erro mais comum.",
    ],
    avisos: [AVISO_PADRAO, "Não substitui dermatologista nem protetor solar."],
  },
  {
    slug: "gelatinapower",
    nome: "Gelatina Power",
    categoria: "Suplemento em pó — energia e bem-estar masculino",
    descricao:
      "Suplemento natural em pó que apoia, de forma gradual, a disposição e o bem-estar masculino. O resultado vem com regularidade e varia de pessoa para pessoa.",
    uso: [
      { rotulo: "Dose", valor: "Conforme o rótulo (padrão: 1 dose por dia)" },
      { rotulo: "Preparo", valor: "Dissolver em água" },
      { rotulo: "Duração", valor: "Uso contínuo por algumas semanas; kits maiores para acompanhamento mais longo" },
    ],
    dicas: [
      "Tome todos os dias — o efeito é acumulativo.",
      "Os primeiros sinais são de disposição e energia; dê tempo ao uso.",
      "Não interrompa cedo achando que \"não funcionou\".",
    ],
    avisos: [AVISO_PADRAO],
  },
  {
    slug: "gelatinax",
    nome: "Gelatinax",
    categoria: "Solução em pó — conforto e mobilidade na rotina",
    descricao:
      "Solução em pó de uso diário voltada ao suporte do bem-estar, do conforto e da rotina de mobilidade, de forma gradual e individual.",
    uso: [
      { rotulo: "Dose", valor: "Uso diário, conforme instruções do rótulo" },
      { rotulo: "Preparo", valor: "Pó solúvel — siga o modo de preparo do rótulo" },
    ],
    dicas: [
      "Regularidade é a chave: use todos os dias.",
      "Não dobre a dose por ansiedade ou por ter esquecido um dia.",
      "A resposta é gradual — compare com você mesmo, não com terceiros.",
    ],
    avisos: [AVISO_PADRAO, "Não substitui médico, fisioterapia nem tratamento prescrito."],
  },
  {
    slug: "glicocell",
    nome: "Glicocell",
    categoria: "Suplemento em cápsulas — apoio ao controle da glicose",
    descricao:
      "Fórmula natural em cápsulas, à base do composto do quiabo, que apoia o organismo no controle da glicose com uso contínuo. É um complemento — não substitui o tratamento médico.",
    uso: [
      { rotulo: "Dose", valor: "1 cápsula por dia (igual para todos)" },
      { rotulo: "Como tomar", valor: "Com um copo de água, antes do café da manhã" },
      { rotulo: "Duração", valor: "Uso contínuo — a resposta vem com a regularidade, não de um dia para o outro" },
    ],
    dicas: [
      "Mantenha o uso diário no mesmo horário para criar rotina.",
      "Siga normalmente a dieta e o acompanhamento médico.",
      "Não espere a glicemia mudar em 1 ou 2 dias — o apoio é gradual.",
    ],
    avisos: [AVISO_PADRAO, AVISO_MEDICACAO],
  },
  {
    slug: "linfavit",
    nome: "LinfaVit",
    categoria: "Suplemento em cápsulas — leveza e bem-estar",
    descricao:
      "Suplemento natural em cápsulas voltado ao suporte do bem-estar e da sensação de leveza de quem se sente inchada, de forma gradual e individual.",
    uso: [
      { rotulo: "Dose", valor: "Cápsulas de uso diário, conforme instruções do rótulo" },
    ],
    dicas: [
      "Use de forma regular, sem pular dias.",
      "Não dobre a dose por conta própria.",
      "Movimentar o corpo e beber água potencializam a sensação de leveza.",
    ],
    avisos: [AVISO_PADRAO, "Não substitui médico, meia de compressão nem tratamento prescrito."],
  },
  {
    slug: "memoclear",
    nome: "MemoClear",
    categoria: "Suplemento em cápsulas — memória e foco",
    descricao:
      "Suplemento natural em cápsulas que apoia, de forma gradual, a saúde cerebral, a memória e o foco. O resultado depende de regularidade e varia de pessoa para pessoa.",
    uso: [
      { rotulo: "Dose", valor: "2 cápsulas por dia (confira o rótulo)" },
      { rotulo: "Como tomar", valor: "Com água" },
      { rotulo: "Melhor horário", valor: "Preferencialmente antes de dormir" },
      { rotulo: "Duração", valor: "Uso contínuo de pelo menos 6 semanas para começar a perceber" },
    ],
    dicas: [
      "A constância diária é essencial — não pule dias.",
      "Bom sono e leitura diária ajudam a potencializar o foco.",
      "Não interrompa cedo: a resposta é gradual.",
    ],
    avisos: [AVISO_PADRAO, AVISO_MEDICACAO],
  },
  {
    slug: "menoflam",
    nome: "MenoFlam",
    categoria: "Solução em pó — bem-estar feminino",
    descricao:
      "Solução em pó de uso diário voltada ao suporte do bem-estar feminino e do equilíbrio da rotina nessa fase da vida, de forma gradual e individual.",
    uso: [
      { rotulo: "Dose", valor: "Uso diário, conforme instruções do rótulo" },
      { rotulo: "Preparo", valor: "Pó solúvel — siga o modo de preparo do rótulo" },
    ],
    dicas: [
      "Use todos os dias — a regularidade constrói o resultado.",
      "Não dobre a dose por conta própria.",
      "Sono e rotina leve de exercícios ajudam no bem-estar geral.",
    ],
    avisos: [AVISO_PADRAO, "Não é hormônio nem reposição hormonal; não substitui seu ginecologista."],
  },
  {
    slug: "pelvimax",
    nome: "Pelvimax",
    categoria: "Suplemento em cápsulas — bem-estar urinário",
    descricao:
      "Suplemento natural em cápsulas voltado ao suporte do bem-estar urinário e da confiança na rotina, de forma gradual e individual.",
    uso: [
      { rotulo: "Dose", valor: "Cápsulas de uso diário, conforme instruções do rótulo" },
    ],
    dicas: [
      "Use de forma regular, sem pular dias.",
      "Não dobre a dose por ansiedade.",
      "A resposta é gradual — acompanhe sua própria evolução semana a semana.",
    ],
    avisos: [AVISO_PADRAO, "Não substitui urologista, ginecologista nem fisioterapia pélvica."],
  },
];

// ── Resolver: nome do produto no pedido → conteúdo ───────────────────────────
// O banco tem variações ("DERMA BLOOM", "Derma Bloom", "GELATIDINA (Televendas)",
// "POWER 66 6 POTES"...). Normaliza e casa por padrão; a ordem dos padrões
// importa (GELATINAX antes de qualquer coisa com "GELATINA").

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\(TELEVENDAS\)/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

const PADROES: [string, string][] = [
  ["GELATIDINA", "gelatidina"],
  ["GELATINAX", "gelatinax"],
  ["GELATINAPOWER", "gelatinapower"],
  ["GELATINA31", "gelatina31"],
  ["DERMABLOOM", "dermabloom"],
  ["POWER66", "power66"],
  ["MEMOCLEAR", "memoclear"],
  ["GLICOCELL", "glicocell"],
  ["LINFAVIT", "linfavit"],
  ["MENOFLAM", "menoflam"],
  ["PELVIMAX", "pelvimax"],
];

export function conteudoDoProduto(
  produtoNome: string | null,
  produtoGrupo: string | null
): ConteudoProduto | null {
  for (const fonte of [produtoGrupo, produtoNome]) {
    if (!fonte) continue;
    const n = normalizar(fonte);
    for (const [padrao, slug] of PADROES) {
      if (n.includes(padrao)) {
        return CONTEUDO_PRODUTOS.find((c) => c.slug === slug) ?? null;
      }
    }
  }
  return null;
}
