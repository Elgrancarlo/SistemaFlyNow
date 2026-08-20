// Conteúdo público da aba "Como usar" — fonte oficial: FICHA_<PRODUTO>.docx do
// pacote "FLY LABS • Aplicativo pós-compra" (ago/2026) para power66, gelatidina,
// dermabloom, glicocell e memoclear; demais produtos seguem os briefings SAC.
// Versão segura para o cliente final: só uso, rotina e avisos; nada de material
// interno de atendimento. Produto sem entrada aqui cai no fallback genérico.

export interface FaqProduto {
  pergunta: string;
  resposta: string;
}

export interface ConteudoProduto {
  slug: string;
  nome: string;
  categoria: string;
  descricao: string;
  uso: { rotulo: string; valor: string }[];
  passos?: string[];
  dicas: string[];
  faq?: FaqProduto[];
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
    categoria: "Suplemento em pó — disposição e bem-estar masculino",
    descricao:
      "Suplemento alimentar natural em pó, de uso diário, que apoia de forma gradual a disposição e o bem-estar masculino. É uma rotina simples, feita em casa, com discrição total. O resultado depende da regularidade e varia de pessoa para pessoa.",
    uso: [
      { rotulo: "Dose", valor: "1 dose por dia — a mesma para todas as pessoas" },
      { rotulo: "Preparo", valor: "Dissolver em água e mexer por cerca de 30 segundos" },
      { rotulo: "Melhor horário", valor: "Preferencialmente pela manhã" },
      { rotulo: "Frequência", valor: "1 vez ao dia, todos os dias, sem pular" },
      {
        rotulo: "Duração",
        valor: "Uso contínuo de pelo menos 90 dias; protocolo completo de ~150 dias (5 potes)",
      },
    ],
    passos: [
      "Encha um copo com água.",
      "Adicione 1 dose conforme a medida indicada no rótulo.",
      "Mexa por cerca de 30 segundos, até dissolver bem.",
      "Tome em seguida, de preferência pela manhã.",
      "Feche bem o pote e guarde em local fresco e seco.",
    ],
    dicas: [
      "A constância diária é o que faz diferença — não pule dias.",
      "Os primeiros sinais costumam ser de mais disposição e energia.",
      "Mantenha uma boa hidratação ao longo do dia.",
      "Sono e alimentação influenciam diretamente na sua disposição.",
      "Não dobre a dose se esquecer de um dia.",
    ],
    faq: [
      {
        pergunta: "Como eu tomo o Power 66?",
        resposta:
          "1 dose por dia, dissolvida em água (mexa por cerca de 30 segundos), preferencialmente pela manhã. A dose é a mesma para todas as pessoas — você não precisa enviar medidas nem dados corporais.",
      },
      {
        pergunta: "Em quanto tempo eu vejo resultado?",
        resposta:
          "O Power 66 age de forma gradual. Nos primeiros 7 a 20 dias os sinais costumam ser sutis, geralmente ligados a mais disposição e energia. Entre 20 e 60 dias a sensação tende a ficar mais consistente, e de 60 dias em diante a resposta é mais perceptível para quem manteve regularidade. Cada organismo responde no seu ritmo.",
      },
      {
        pergunta: "Esqueci de tomar um dia. Posso dobrar a dose?",
        resposta:
          "Não. É só retomar no dia seguinte, no horário de sempre. Dobrar a dose não acelera nada — o que constrói o resultado é a constância ao longo das semanas.",
      },
      {
        pergunta: "Posso tomar se uso medicação contínua ou tenho alguma condição de saúde?",
        resposta:
          "Nesse caso, converse com o seu médico ANTES de começar. O Power 66 é um suplemento alimentar, não é medicamento. Se você já começou e sentiu qualquer reação, interrompa o uso e fale com o seu médico.",
      },
    ],
    avisos: [AVISO_PADRAO],
  },
  {
    slug: "gelatidina",
    nome: "Gelatidina",
    categoria: "Suplemento em pó — saciedade e bem-estar",
    descricao:
      "Fórmula natural em pó, à base de gelatina e fibras, de uso diário. Atua nos sinais naturais do corpo ligados à fome e à saciedade, apoiando o reequilíbrio da rotina alimentar de forma gradual. O que faz diferença é a regularidade do uso.",
    uso: [
      { rotulo: "Dose", valor: "1 dose por dia (confira o rótulo recebido)" },
      { rotulo: "Preparo", valor: "Misturar o pó com a gelatina conforme a embalagem (cerca de 30 segundos)" },
      { rotulo: "Melhor horário", valor: "Antes de dormir" },
      { rotulo: "Frequência", valor: "1 vez ao dia, todos os dias, sem pular" },
      { rotulo: "Duração", valor: "Uso contínuo de 3 a 6 meses para uma resposta mais consistente" },
    ],
    passos: [
      "Separe 1 dose conforme a medida indicada no rótulo.",
      "Misture o pó com a gelatina conforme a orientação da embalagem.",
      "Mexa até dissolver completamente (cerca de 30 segundos).",
      "Consuma antes de dormir.",
      "Feche bem o pote e guarde em local fresco e seco.",
    ],
    dicas: [
      "A constância diária é o que faz diferença — não pule dias.",
      "Os primeiros sinais são internos: menos fome, menos inchaço, mais disposição.",
      "Não combine com dietas extremas ou restritivas.",
      "Mantenha uma boa hidratação ao longo do dia.",
      "Não dobre a dose se esquecer de um dia.",
    ],
    faq: [
      {
        pergunta: "Como eu tomo a Gelatidina?",
        resposta:
          "1 dose por dia, misturada com a gelatina conforme a orientação do rótulo. O preparo leva cerca de 30 segundos. O melhor horário é antes de dormir, e o ideal é tomar todos os dias, sem pular.",
      },
      {
        pergunta: "Em quanto tempo eu vejo resultado?",
        resposta:
          "A Gelatidina age de forma gradual. Nos primeiros 5 a 15 dias os sinais costumam ser internos — menos fome, menos inchaço, mais disposição. Entre 15 e 45 dias a mudança tende a ficar mais perceptível, e de 45 dias em diante a resposta é mais visível para quem manteve regularidade. Cada organismo responde no seu ritmo.",
      },
      {
        pergunta: "Esqueci de tomar um dia. Posso dobrar a dose?",
        resposta:
          "Não. É só retomar no dia seguinte, no horário de sempre. Dobrar a dose não acelera nada — o que constrói o resultado é a constância ao longo das semanas.",
      },
      {
        pergunta: "Posso tomar com meu remédio ou junto de uma dieta?",
        resposta:
          "A Gelatidina é um suplemento alimentar, não é medicamento. Se você usa medicação contínua ou faz acompanhamento de saúde, converse com o seu médico antes de começar. E evite combinar com dietas extremamente restritivas — a proposta é apoiar a sua rotina, não sobrecarregá-la.",
      },
    ],
    avisos: [AVISO_PADRAO],
  },
  {
    slug: "dermabloom",
    nome: "Derma Bloom",
    categoria: "Suplemento em pó — beleza e aparência da pele",
    descricao:
      "Suplemento alimentar em pó, de uso diário, formulado para apoiar de forma gradual a saúde e a aparência da pele. Ele trabalha junto com a sua rotina de cuidado: o que faz diferença é a regularidade, dia após dia. Cada pele responde no seu próprio ritmo.",
    uso: [
      { rotulo: "Dose", valor: "3 g (½ scoop) ao dia — a mesma dose para todas as pessoas" },
      { rotulo: "Preparo", valor: "Dissolver em 200 ml de água e mexer por cerca de 30 segundos" },
      { rotulo: "Melhor horário", valor: "Preferencialmente à noite, antes de dormir" },
      { rotulo: "Frequência", valor: "1 vez ao dia, todos os dias, sem pular" },
      { rotulo: "Duração", valor: "30 a 90 dias de uso contínuo para perceber resposta; rotina completa de 6 meses" },
    ],
    passos: [
      "Encha um copo com 200 ml de água.",
      "Adicione 1 medida de 3 g (½ scoop) do pó.",
      "Mexa por cerca de 30 segundos, até dissolver bem.",
      "Tome em seguida, de preferência à noite, antes de dormir.",
      "Feche bem o pote e guarde em local fresco e seco.",
    ],
    dicas: [
      "A constância diária é o que faz diferença — não pule dias.",
      "Os primeiros sinais são sutis: pele mais hidratada e com mais viço.",
      "Mantenha uma boa hidratação ao longo do dia.",
      "Sono, alimentação e protetor solar ajudam muito no resultado.",
      "Não dobre a dose se esquecer de um dia.",
    ],
    faq: [
      {
        pergunta: "Como eu tomo o Derma Bloom?",
        resposta:
          "É simples: 1 dose de 3 g (½ scoop) por dia, dissolvida em 200 ml de água, de preferência à noite antes de dormir. A dose é a mesma para todas as pessoas — você não precisa enviar peso, medidas ou fazer nenhum cálculo.",
      },
      {
        pergunta: "Em quanto tempo eu vejo resultado?",
        resposta:
          "O Derma Bloom age de forma gradual, junto com o funcionamento natural do corpo. Nos primeiros 7 a 15 dias os sinais costumam ser sutis (pele mais hidratada, mais viço). Entre 15 e 45 dias a percepção tende a ficar mais consistente, e de 45 dias em diante a resposta é mais perceptível para quem manteve regularidade.",
      },
      {
        pergunta: "Esqueci de tomar um dia. E agora?",
        resposta:
          "Sem problema: é só retomar no dia seguinte, no horário de sempre. Nunca dobre a dose para \"compensar\". O que constrói o resultado é a constância ao longo das semanas, não uma dose isolada.",
      },
      {
        pergunta: "Posso tomar junto com meu remédio de uso contínuo?",
        resposta:
          "O Derma Bloom é um suplemento alimentar, não é medicamento. Mesmo assim, se você usa medicação contínua ou tem alguma condição de saúde, o mais seguro é conversar com o seu médico antes de começar.",
      },
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
    categoria: "Suplemento em cápsulas — apoio ao equilíbrio da glicose",
    descricao:
      "Suplemento alimentar em cápsulas, à base do composto do quiabo, de uso contínuo e diário. Apoia o organismo dentro da sua rotina de cuidado. É um complemento — não substitui insulina, remédio ou o acompanhamento do seu médico.",
    uso: [
      { rotulo: "Dose", valor: "1 cápsula por dia — a mesma dose para todas as pessoas" },
      { rotulo: "Como tomar", valor: "Com um copo de água" },
      { rotulo: "Melhor horário", valor: "Antes do café da manhã" },
      { rotulo: "Frequência", valor: "1 vez ao dia, todos os dias, sem pular" },
      { rotulo: "Duração", valor: "Uso contínuo — a resposta vem com a regularidade, não de um dia para o outro" },
    ],
    passos: [
      "Separe 1 cápsula.",
      "Tome com um copo de água.",
      "Faça isso antes do café da manhã, todos os dias.",
      "Mantenha o seu acompanhamento médico normalmente.",
      "Feche bem o frasco e guarde em local fresco e seco.",
    ],
    dicas: [
      "A constância diária é o que faz diferença — não pule dias.",
      "NUNCA pare nem reduza sua medicação por conta própria.",
      "Continue medindo sua glicemia e fazendo o acompanhamento médico de sempre.",
      "Alimentação e sono influenciam diretamente na sua rotina.",
      "Não dobre a dose se esquecer de um dia.",
    ],
    faq: [
      {
        pergunta: "Como eu tomo o Glicocell?",
        resposta:
          "1 cápsula por dia, com um copo de água, antes do café da manhã. A dose é a mesma para todas as pessoas — você não precisa enviar peso, medidas ou exames.",
      },
      {
        pergunta: "Posso parar ou reduzir o meu remédio / minha insulina?",
        resposta:
          "Não, de jeito nenhum. O Glicocell é um suplemento alimentar e um complemento na sua rotina — ele não substitui medicamento, insulina nem o seu acompanhamento médico. Qualquer mudança na sua medicação só pode ser feita pelo seu médico.",
      },
      {
        pergunta: "Em quanto tempo eu vejo resultado?",
        resposta:
          "O Glicocell age de forma gradual e com uso contínuo — não é de um dia para o outro. A resposta varia muito de pessoa para pessoa, dependendo do quadro clínico, da medicação, da alimentação e do acompanhamento médico.",
      },
      {
        pergunta: "Esqueci de tomar um dia. Posso dobrar a dose?",
        resposta:
          "Não. É só retomar no dia seguinte, antes do café. Dobrar a dose não acelera nada — o que faz diferença é a constância do uso.",
      },
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
    categoria: "Suplemento em cápsulas — memória, foco e clareza mental",
    descricao:
      "Suplemento alimentar natural em cápsulas, de uso diário, que apoia de forma gradual a saúde cerebral, a memória e o foco. É uma rotina simples, feita em casa, todos os dias. O resultado depende da regularidade e varia de pessoa para pessoa.",
    uso: [
      { rotulo: "Dose", valor: "2 cápsulas por dia (confira o rótulo recebido)" },
      { rotulo: "Como tomar", valor: "Com um copo de água" },
      { rotulo: "Melhor horário", valor: "Preferencialmente antes de dormir" },
      { rotulo: "Frequência", valor: "Todos os dias, sem pular" },
      { rotulo: "Duração", valor: "Uso contínuo de pelo menos 6 semanas para começar a perceber" },
    ],
    passos: [
      "Separe 2 cápsulas (confira o rótulo do seu frasco).",
      "Tome com um copo de água.",
      "Faça isso preferencialmente antes de dormir.",
      "Mantenha o seu acompanhamento médico normalmente.",
      "Feche bem o frasco e guarde em local fresco e seco.",
    ],
    dicas: [
      "A constância diária é o que faz diferença — não pule dias.",
      "Os primeiros sinais são sutis: sensação de mais disposição e clareza.",
      "NUNCA pare nem substitua sua medicação por conta própria.",
      "Sono e alimentação influenciam muito no foco e na memória.",
      "Não dobre a dose se esquecer de um dia.",
    ],
    faq: [
      {
        pergunta: "Como eu tomo o MemoClear?",
        resposta:
          "2 cápsulas por dia (confira o rótulo do seu frasco), com um copo de água, preferencialmente antes de dormir. A dose é a mesma para todas as pessoas — você não precisa enviar exames nem dados de saúde.",
      },
      {
        pergunta: "Em quanto tempo eu vejo resultado?",
        resposta:
          "O MemoClear age de forma gradual. Nas primeiras 1 a 2 semanas os sinais costumam ser sutis — uma sensação de mais disposição e clareza. Entre 2 e 6 semanas a percepção tende a ficar mais consistente, e de 6 semanas em diante ela costuma se estabilizar para quem manteve regularidade.",
      },
      {
        pergunta: "Posso parar ou trocar o meu remédio?",
        resposta:
          "Não. O MemoClear é um suplemento alimentar e não substitui nenhum medicamento nem o acompanhamento do seu médico. Qualquer mudança na sua medicação só pode ser feita pelo seu médico.",
      },
      {
        pergunta: "Esqueci de tomar um dia. Posso dobrar a dose?",
        resposta:
          "Não. É só retomar no dia seguinte, no horário de sempre. Dobrar a dose não acelera nada — o que constrói o resultado é a constância ao longo das semanas.",
      },
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
  // laxantril ainda não tem ficha de conteúdo — o slug existe para resolver a
  // foto do produto em midia-produtos.ts (conteudoDoProduto devolve null).
  ["LAXANTRIL", "laxantril"],
];

export function slugDoProduto(
  produtoNome: string | null,
  produtoGrupo: string | null
): string | null {
  for (const fonte of [produtoGrupo, produtoNome]) {
    if (!fonte) continue;
    const n = normalizar(fonte);
    for (const [padrao, slug] of PADROES) {
      if (n.includes(padrao)) return slug;
    }
  }
  return null;
}

export function conteudoDoProduto(
  produtoNome: string | null,
  produtoGrupo: string | null
): ConteudoProduto | null {
  const slug = slugDoProduto(produtoNome, produtoGrupo);
  if (!slug) return null;
  return CONTEUDO_PRODUTOS.find((c) => c.slug === slug) ?? null;
}
