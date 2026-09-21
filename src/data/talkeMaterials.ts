import { TalkeMaterialItem } from '../domain/types';

export const TALKE_CURRICULUM_MATERIALS: TalkeMaterialItem[] = [
  // ==========================================
  // NÍVEL BÁSICO (A1 / A2)
  // ==========================================
  {
    id: 'mat-bas-1',
    tier: 'BASICO',
    tierLabel: 'Básico',
    cefr: 'A1 - Iniciante',
    unitNumber: 1,
    title: 'Unidade 1: Primeiros Passos & Apresentações Pessoais',
    objective: 'Aprender a se apresentar com confiança, falar sobre profissão, país de origem e cumprimentos formais e informais.',
    durationMinutes: 50,
    grammarFocus: 'Verb To Be (am/is/are), Subject Pronouns (I, you, he, she, we, they), Simple Wh- Questions (What, Where, Who)',
    vocabulary: [
      'Greetings: Nice to meet you, How are you doing?, Good morning/afternoon',
      'Origins: Where are you from?, I am from Brazil, I live in São Paulo',
      'Professions: Software engineer, Designer, Accountant, Teacher, Student',
      'Numbers & Contact: What is your phone number?, email address',
    ],
    discussionQuestions: [
      'What is your name and how do you spell your last name?',
      'Where were you born and where do you live right now?',
      'What do you do for a living? Do you enjoy your work?',
      'Why do you want to learn English with Talkê?',
    ],
    roleplayScenario: 'Simulação de Primeiro Encontro em um evento de networking ou aula de boas-vindas: o aluno se apresenta a um colega estrangeiro.',
    teacherTips: 'Incentive o aluno a formar frases completas ("I am from Brazil" em vez de apenas "Brazil"). Foque na pronúncia das vogais em "meet" e no som do "th" em "this".',
    homeworkIdea: 'Gravar um áudio de 45 segundos no WhatsApp se apresentando em inglês com nome, profissão e 2 hobbies.',
    slides: [
      {
        title: 'Warm-up & Icebreaker',
        bullets: [
          'Say hello to your partner: "Hello! My name is..."',
          'Ask: "What is your name?" and "Where are you from?"',
          'Practice greeting tones: Formal ("Good afternoon") vs Casual ("Hey, what\'s up?")',
        ],
        example: 'A: "Hi, I\'m Lucas. Nice to meet you!" | B: "Nice to meet you too, Lucas! I\'m Sarah."',
        exercisePrompt: 'Complete: "I live in ____ and I work as a ____."',
      },
      {
        title: 'Grammar Core: Verb To Be',
        bullets: [
          'Affirmative: I am (I\'m), You are (You\'re), He/She/It is (He\'s)',
          'Negative: I am not, You are not (aren\'t), He is not (isn\'t)',
          'Questions: Are you a student? Yes, I am. / No, I\'m not.',
        ],
        example: '"She is an architect from Rio de Janeiro."',
        exercisePrompt: 'Transform into a question: "He is from Canada."',
      },
      {
        title: 'Speaking Practice: Roleplay',
        bullets: [
          'Scenario: You are at an international meetup in Lisbon.',
          'Introduce yourself, ask what the other person does, and exchange contact info.',
        ],
        example: '"Could I have your email address to stay in touch?"',
      },
    ],
  },
  {
    id: 'mat-bas-2',
    tier: 'BASICO',
    tierLabel: 'Básico',
    cefr: 'A1 - A2 Básico',
    unitNumber: 2,
    title: 'Unidade 2: Rotina Diária & Gerenciamento de Tempo',
    objective: 'Descrever a própria rotina matinal e noturna, horários de trabalho e frequência de atividades.',
    durationMinutes: 50,
    grammarFocus: 'Simple Present (do/does, 3rd person -s/-es), Adverbs of Frequency (always, usually, sometimes, never), Prepositions of Time (at 8am, on Monday, in the morning)',
    vocabulary: [
      'Morning: Wake up, brush teeth, have breakfast, take a shower',
      'Work: Start work, attend meetings, check emails, take a lunch break',
      'Leisure: Go to the gym, watch series, read books, cook dinner, go to bed',
      'Time: Half past eight, quarter to seven, at noon, at midnight',
    ],
    discussionQuestions: [
      'What time do you usually wake up on weekdays vs weekends?',
      'What is the very first thing you do in the morning?',
      'How often do you exercise or go to the gym?',
      'Do you prefer working in the morning or at night? Why?',
    ],
    roleplayScenario: 'Comparação de agendas: O aluno e o professor comparam suas semanas para encontrar um horário livre para um café ou projeto.',
    teacherTips: 'Atenção especial ao "S" na 3ª pessoa ("He works", "She drinks"). Faça exercícios de repetição auditiva divertida.',
    homeworkIdea: 'Escrever 5 frases descrevendo o seu dia perfeito de domingo usando "always", "usually" e "never".',
    slides: [
      {
        title: 'Describing Your Typical Day',
        bullets: [
          'Morning routine: "I usually wake up at 7:00 AM."',
          'Work/Study: "I start working around 9:00 AM."',
          'Evening relaxation: "I unwind by watching YouTube or cooking."',
        ],
        example: '"My brother always has coffee before speaking to anyone."',
        exercisePrompt: 'Say 3 things you NEVER do on a Monday morning.',
      },
      {
        title: 'Grammar: Simple Present & Adverbs',
        bullets: [
          'Subject + Adverb + Verb: "I always wake up early."',
          'Exception with To Be: "He is always happy."',
          'Negative: "I don\'t eat meat" / "She doesn\'t drink soda."',
        ],
        example: '"Do you check your emails on weekends?"',
      },
    ],
  },
  {
    id: 'mat-bas-3',
    tier: 'BASICO',
    tierLabel: 'Básico',
    cefr: 'A2 - Básico / Viagens',
    unitNumber: 3,
    title: 'Unidade 3: Viagens, Aeroporto & Sobrevivência no Exterior',
    objective: 'Comunicar-se com facilidade no aeroporto, imigração, pedir refeições em restaurantes e pedir orientações na rua.',
    durationMinutes: 50,
    grammarFocus: 'Modal Verbs for Politeness (Can I have...?, Could you please...?, Would like), Prepositions of Place (next to, opposite, on the corner)',
    vocabulary: [
      'Airport: Boarding pass, gate, passport control, luggage/baggage claim, customs',
      'Restaurant: Menu, order, bill/check, sparkling water, napkin, vegetarian options',
      'Directions: Turn left, turn right, go straight ahead, across from the bank',
      'Phrases: "Excuse me, where is gate 14?", "I would like a cappuccino, please"',
    ],
    discussionQuestions: [
      'What was the best trip you have ever taken in your life?',
      'Do you feel nervous speaking English at international airports or border control?',
      'What kind of food do you like to order when traveling abroad?',
      'If you could travel anywhere tomorrow with Talkê, where would you go?',
    ],
    roleplayScenario: 'Oficial de Imigração e Passageiro: O professor faz o papel de oficial no aeroporto JFK (Nova York) ou Heathrow (Londres), perguntando motivo da viagem, hospedagem e passagem de volta.',
    teacherTips: 'Enfatize a entonação de gentileza em "Could I have..." para soar natural e receptivo em países de língua inglesa.',
    homeworkIdea: 'Criar um diálogo simulado fazendo um pedido em uma cafeteria e enviar por mensagem de texto.',
    slides: [
      {
        title: 'Airport Survival Guide',
        bullets: [
          'At the check-in desk: "I have two bags to check and one carry-on."',
          'At Border Control: "I am here on vacation for 10 days."',
          'Finding your gate: "Excuse me, is this the line for flight 204 to Miami?"',
        ],
        example: '"Officer: What is the purpose of your visit? You: Tourism and leisure."',
        exercisePrompt: 'Roleplay: You lost your boarding pass. Explain the situation to the attendant.',
      },
      {
        title: 'Ordering Food Like a Local',
        bullets: [
          'Never say: "I want a coffee" (sounds rude).',
          'Always say: "Could I get a latte, please?" or "I would like the grilled salmon."',
          'Asking for the bill: "Could we have the check, please?"',
        ],
        example: '"Is service included in the bill?"',
      },
    ],
  },
  {
    id: 'mat-bas-4',
    tier: 'BASICO',
    tierLabel: 'Básico',
    cefr: 'A2 - Básico / Narrativa',
    unitNumber: 4,
    title: 'Unidade 4: Experiências Passadas & Storytelling Simples',
    objective: 'Contar histórias sobre o que fez no último fim de semana, férias inesquecíveis e acontecimentos marcantes.',
    durationMinutes: 50,
    grammarFocus: 'Past Simple (Regular verbs with -ed, Irregular verbs: went, ate, bought, had, saw), Time expressions (yesterday, last night, two weeks ago, in 2021)',
    vocabulary: [
      'Verbs: Go -> Went, Eat -> Ate, Have -> Had, Buy -> Bought, See -> Saw, Meet -> Met',
      'Descriptors: Wonderful, terrible, relaxing, exhausting, delicious, noisy',
      'Connectors: First, then, after that, suddenly, finally',
    ],
    discussionQuestions: [
      'What did you do last weekend? Tell me from Saturday morning to Sunday night.',
      'What was the last movie you watched? Did you like it?',
      'Tell me about an unexpected funny situation that happened to you in the past.',
    ],
    roleplayScenario: 'Dois amigos se reencontram após as férias de verão e compartilham os altos e baixos de suas viagens.',
    teacherTips: 'Explique a pronúncia do sufixo "-ed" (/t/, /d/, /id/). Mostre que nem todo "-ed" ganha uma sílaba extra (ex: "worked" = som de t).',
    homeworkIdea: 'Escrever um parágrafo de 6 linhas relatando um dia marcante do ano passado usando pelo menos 4 verbos irregulares.',
    slides: [
      {
        title: 'Talking About The Past',
        bullets: [
          'Regular verbs: work -> worked, travel -> traveled, watch -> watched',
          'Irregular verbs: do -> did, go -> went, see -> saw, buy -> bought',
          'Questions with DID: "Did you go out last night?" -> "Yes, I did!"',
        ],
        example: '"Last year I visited my family in Florianópolis and we ate incredible seafood."',
        exercisePrompt: 'Ask the teacher 3 questions about their last birthday.',
      },
    ],
  },

  // ==========================================
  // NÍVEL INTERMEDIÁRIO (B1 / B2)
  // ==========================================
  {
    id: 'mat-int-1',
    tier: 'INTERMEDIARIO',
    tierLabel: 'Intermediário',
    cefr: 'B1 - B2 Intermediário',
    unitNumber: 1,
    title: 'Unidade 1: Inglês Profissional, Reuniões & Small Talk Corporativo',
    objective: 'Conduzir conversas corporativas pré-reunião (small talk), propor ideias em chamadas do Zoom/Meet e enviar emails formais.',
    durationMinutes: 50,
    grammarFocus: 'Present Perfect vs Simple Past (experiences with "have been/done" vs specific time points), Modal verbs for polite proposals (Should, Could, Might)',
    vocabulary: [
      'Meetings: "Can everyone hear me okay?", "Let\'s dive in", "Could you mute your mic?", "Wrap up"',
      'Business idioms: Touch base, keep in the loop, drill down, hit the ground running',
      'Small talk: "How was your weekend?", "Any big plans for the holiday?", "Terrible weather, isn\'t it?"',
    ],
    discussionQuestions: [
      'How much English do you use currently in your daily work or emails?',
      'What is the hardest part for you during a remote meeting with international colleagues?',
      'How do you feel about making small talk before getting to business?',
      'Can you share an experience where you had to solve an urgent deadline issue?',
    ],
    roleplayScenario: 'Simulação de Reunião de Alinhamento: O professor e o aluno atuam como líderes de equipe revisando as metas do trimestre e resolvendo um atraso de projeto.',
    teacherTips: 'Trabalhe o uso de fillers naturais ("Well...", "To be honest...", "As far as I know...") para ganhar tempo sem perder a cadência da fala.',
    homeworkIdea: 'Redigir um email de 3 parágrafos solicitando prorrogação de prazo para um cliente internacional com tom cordial.',
    slides: [
      {
        title: 'Mastering Remote Business Meetings',
        bullets: [
          'Checking audio: "You\'re on mute!", "Can you see my screen clearly?"',
          'Transitioning: "Moving on to our next agenda item...", "Let\'s circle back to this later."',
          'Interruping politely: "Sorry to jump in, but may I add something?"',
        ],
        example: '"Let\'s touch base tomorrow morning before the client presentation."',
        exercisePrompt: 'How would you diplomatically disagree with a colleague\'s proposal?',
      },
      {
        title: 'Present Perfect in Career Contexts',
        bullets: [
          'Unfinished time / Experiences: "I have worked in tech for 6 years."',
          'Specific past: "I joined this company in 2021." (Simple past with date)',
          'Recent actions with \'just\' / \'already\' / \'yet\': "I haven\'t received the report yet."',
        ],
        example: '"Have you ever presented a project entirely in English?"',
      },
    ],
  },
  {
    id: 'mat-int-2',
    tier: 'INTERMEDIARIO',
    tierLabel: 'Intermediário',
    cefr: 'B1 - B2 Intermediário',
    unitNumber: 2,
    title: 'Unidade 2: Expressando Opiniões, Acordo e Desacordo Construtivo',
    objective: 'Defender pontos de vista, argumentar com firmeza sem soar agressivo e debater tópicos modernos do cotidiano.',
    durationMinutes: 50,
    grammarFocus: 'Conditional Sentences (1st & 2nd conditionals: "If we invest..., we will..." vs "If I were the manager, I would..."), Discourse markers',
    vocabulary: [
      'Agreeing: "I couldn\'t agree more", "You have a point there", "Precisely"',
      'Disagreeing: "I see where you\'re coming from, but...", "I\'m not entirely convinced that..."',
      'Nuance: In my view, from my perspective, on the other hand, nevertheless',
    ],
    discussionQuestions: [
      'Do you think artificial intelligence will replace jobs or create better opportunities?',
      'Is 100% remote work better than hybrid work models? What are the pros and cons?',
      'How do you react when someone strongly disagrees with your project in public?',
    ],
    roleplayScenario: 'Debate executivo: Decidir entre contratar 3 estagiários ou 1 consultor sênior experiente com orçamento limitado.',
    teacherTips: 'Desafie o aluno a usar a estrutura "I see your point, but..." antes de contra-argumentar. Isso constrói fluência colaborativa.',
    homeworkIdea: 'Gravar um vídeo de 1 minuto expressando sua opinião sobre um tema polêmico e fundamentando com 2 argumentos.',
    slides: [
      {
        title: 'Diplomatic Disagreement Toolkit',
        bullets: [
          'Soften your stance: "I\'m afraid I see it a bit differently."',
          'Validate first: "That\'s a valid concern, however we must consider costs."',
          'Ask clarifying questions: "What led you to that conclusion?"',
        ],
        example: '"While I understand the urgency, rushing this feature might create bugs."',
        exercisePrompt: 'Practice turning "You are wrong" into a diplomatic sentence.',
      },
    ],
  },
  {
    id: 'mat-int-3',
    tier: 'INTERMEDIARIO',
    tierLabel: 'Intermediário',
    cefr: 'B2 - Intermediário Avançado',
    unitNumber: 3,
    title: 'Unidade 3: Phrasal Verbs no Dia a Dia Corporativo & Informal',
    objective: 'Dominar os 20 phrasal verbs mais usados em conversas reais, eliminando o vício de usar apenas termos latinos genéricos.',
    durationMinutes: 50,
    grammarFocus: 'Separable vs Inseparable Phrasal Verbs, Particle meanings (Up, Out, Off, Down)',
    vocabulary: [
      'Work: Figure out, call off (cancel), put off (delay), look forward to, catch up on',
      'Tech: Back up, log in/out, shut down, roll out, carry out',
      'Social: Hang out, run into, count on, turn down (reject), bring up (mention)',
    ],
    discussionQuestions: [
      'What is something at work that you have been putting off for too long?',
      'When was the last time you ran into an old friend unexpectedly?',
      'Who is someone you can always count on when facing a tough challenge?',
    ],
    roleplayScenario: 'Resolução de crise: Uma entrega de software falhou. Aluno e professor conversam sobre o que aconteceu (carry out tests, figure out the bug, back up the database).',
    teacherTips: 'Evite listas mecânicas de decoreba. Agrupe phrasal verbs por contexto emocional e peça exemplos reais da rotina do aluno.',
    homeworkIdea: 'Criar uma breve história de 1 parágrafo utilizando pelo menos 5 phrasal verbs aprendidos na aula.',
    slides: [
      {
        title: 'Natural English with Phrasal Verbs',
        bullets: [
          'Why natives love them: They are punchy, visual and conversational.',
          'Examples: "Instead of \'postpone\', natives say \'put off\'."',
          '"Instead of \'investigate\', say \'look into\'."',
        ],
        example: '"I will look into that bug and get back to you by 3 PM."',
        exercisePrompt: 'Replace the formal verb: "We have to cancel the party." -> "We have to _____ the party."',
      },
    ],
  },

  // ==========================================
  // NÍVEL AVANÇADO (C1 / C2)
  // ==========================================
  {
    id: 'mat-adv-1',
    tier: 'AVANCADO',
    tierLabel: 'Avançado',
    cefr: 'C1 - Avançado',
    unitNumber: 1,
    title: 'Unidade 1: Negociações de Alto Nível & Táticas de Persuasão',
    objective: 'Negociar termos contratuais, concessões mútuas, fechamento de acordos comerciais e resolução de impasses complexos.',
    durationMinutes: 50,
    grammarFocus: 'Third & Mixed Conditionals ("Had we known the risk, we wouldn\'t be in this situation"), Inversion for Emphasis ("Under no circumstances can we accept...")',
    vocabulary: [
      'Negotiation: Leverage, concessions, non-negotiable, BATNA, deadlock/impasse, deal-breaker',
      'Persuasion: Compelling argument, mutually beneficial, trade-off, ballpark figure',
      'Phrases: "We are prepared to meet you halfway", "Provided that you commit to...", "That is slightly beyond our scope"',
    ],
    discussionQuestions: [
      'What was the most difficult negotiation you have ever been involved in?',
      'How do you establish leverage when the other party holds more market power?',
      'In high-stakes discussions, how do you manage tone to stay assertive without being abrasive?',
    ],
    roleplayScenario: 'Negociação de Renovação Contratual: O aluno representa um fornecedor de tecnologia buscando reajuste de 18%, enquanto o professor representa o diretor financeiro cortando custos.',
    teacherTips: 'Foque nas sutilezas de entonação (down-stepping) e ênfase nas palavras-chave para passar autoridade executiva.',
    homeworkIdea: 'Elaborar uma proposta de contra-oferta escrita de 200 palavras com 3 concessões condicionais.',
    slides: [
      {
        title: 'Executive Negotiation Framework',
        bullets: [
          'Anchoring: Setting the initial boundary with confidence.',
          'Conditional concessions: "If you can guarantee X, we could consider Y."',
          'Dealing with pushback: "Help me understand why this timeframe is critical for you."',
        ],
        example: '"Provided that payment is upfront, we can offer a 5% discount on licensing."',
        exercisePrompt: 'Simulate responding to: "Your price is 30% higher than our budget."',
      },
      {
        title: 'Grammar Precision: Inversion & Mixed Conditionals',
        bullets: [
          'Formula: Negative adverb + auxiliary + subject + main verb',
          'Emphasis: "Only after thorough analysis did we spot the flaw."',
          '"Had we signed earlier, we would be enjoying higher margins now."',
        ],
        example: '"Under no circumstances should client data be shared without consent."',
      },
    ],
  },
  {
    id: 'mat-adv-2',
    tier: 'AVANCADO',
    tierLabel: 'Avançado',
    cefr: 'C1 - C2 Fluente',
    unitNumber: 2,
    title: 'Unidade 2: Storytelling Executivo & Comunicação de Liderança',
    objective: 'Transformar dados secos em narrativas envolventes, utilizar metáforas sofisticadas e prender a atenção de plateias exigentes.',
    durationMinutes: 50,
    grammarFocus: 'Rhetorical devices, Parallel structures (The Rule of Three), Advanced passive forms and nominalization',
    vocabulary: [
      'Narrative: Hook, turning point, call to action, emotional resonance, anecdote',
      'Executive verbs: Spearhead, orchestrate, synthesize, capitalize on, foster, dismantle',
      'Metaphors: Double-edged sword, tip of the iceberg, moving the needle, green light',
    ],
    discussionQuestions: [
      'What makes a leader\'s presentation genuinely inspiring rather than boring?',
      'How do you balance emotional connection with hard business metrics?',
      'Think of a major failure or setback in your career. How would you tell that story as a learning pivot?',
    ],
    roleplayScenario: 'Pitch para Investidores / Board of Directors: O aluno tem 3 minutos para apresentar um novo projeto audacioso e responder a 2 perguntas difíceis.',
    teacherTips: 'Observe pausas estratégicas (pregnant pauses). No nível avançado, a velocidade da fala deve dar lugar à clareza e modulação.',
    homeworkIdea: 'Gravar um pitch de 90 segundos aplicando a regra de três e uma metáfora de abertura memorável.',
    slides: [
      {
        title: 'The Art of Executive Storytelling',
        bullets: [
          '1. The Hook: Grab attention in the first 15 seconds (statistic, provocative question, or short anecdote).',
          '2. The Struggle: Define the villain/obstacle your project is solving.',
          '3. The Resolution & Call to Action: Clear vision and next steps.',
        ],
        example: '"We don\'t just build software; we eliminate 12 hours of weekly friction for our engineers."',
        exercisePrompt: 'Deliver the opening 30 seconds of a keynote on innovation in your industry.',
      },
    ],
  },
  {
    id: 'mat-adv-3',
    tier: 'AVANCADO',
    tierLabel: 'Avançado',
    cefr: 'C2 - Domínio Pleno',
    unitNumber: 3,
    title: 'Unidade 3: Nuances Culturais, Humor & Subtexto no Inglês Global',
    objective: 'Compreender ironia, subtexto, sarcasmo britânico, otimismo americano e navegar diferenças culturais em conversas informais e de liderança.',
    durationMinutes: 50,
    grammarFocus: 'Subjunctive Mood ("It is crucial that he be informed"), Cleft sentences for focus ("What really matters is..."), Nuanced hedging',
    vocabulary: [
      'Subtext: Understatement, reading between the lines, double entendre, self-deprecation',
      'British vs American: "With all due respect" (often means \'you are mistaken\'), "Quite good" (UK = just okay; US = great)',
      'Hedging: Arguably, to some extent, purportedly, seemingly, plausible',
    ],
    discussionQuestions: [
      'Have you ever misinterpreted subtext or humor while communicating with native English speakers?',
      'Why is British understatement often confusing for Latin and American professionals?',
      'How do you build authentic rapport across cultural boundaries without feeling fake?',
    ],
    roleplayScenario: 'Jantar de Confraternização Internacional: Conversa descontraída após uma conferência internacional em Londres ou São Francisco.',
    teacherTips: 'Explore como os falantes nativos raramente dizem "não" de forma direta. Mostre as frases de polidez indireta.',
    homeworkIdea: 'Analisar uma cena de série ou palestra TED identificando 3 momentos em que o subtexto diferiu do significado literal.',
    slides: [
      {
        title: 'Decoding Cultural Subtext in Global Teams',
        bullets: [
          '"I hear what you\'re saying" = I disagree and don\'t want to discuss it further.',
          '"That is a very brave proposal" = That is reckless / high risk.',
          '"With the greatest respect..." = I strongly object.',
        ],
        example: '"I will definitely bear that in mind." (Translation: I will probably ignore it).',
        exercisePrompt: 'How would you soften a direct refusal without saying "No"?',
      },
    ],
  },
];
