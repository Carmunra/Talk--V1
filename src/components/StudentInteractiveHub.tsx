import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle,
  Play,
  RotateCcw,
  Sliders,
  Award,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Zap,
  Globe,
  Star,
} from 'lucide-react';
import { Student, Teacher, LearningGoal, ProficiencyLevel } from '../domain/types';

interface StudentInteractiveHubProps {
  currentStudent: Student;
  teachers: Teacher[];
  onBookTeacher: (teacher: Teacher) => void;
  onGoToTeachers: () => void;
}

export const StudentInteractiveHub: React.FC<StudentInteractiveHubProps> = ({
  currentStudent,
  teachers,
  onBookTeacher,
  onGoToTeachers,
}) => {
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'roleplay' | 'matching_calculator' | 'flashcards'>('roleplay');

  // -------------------------------------------------------------
  // 1. SIMULADOR DE SITUAÇÕES REAIS (ROLEPLAY STUDIO)
  // -------------------------------------------------------------
  const scenarios = [
    {
      id: 'tech_meeting',
      title: 'Daily Standup em Tech',
      subtitle: 'Explique seus impedimentos e o que entregará hoje em uma sprint internacional.',
      tag: 'Business & Tech',
      partnerName: 'Emma (Product Lead)',
      partnerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop',
      dialogues: [
        {
          partnerSpeech: "Good morning team! Jonathan, could you give us a quick update on the payment API refactor? Any blockers?",
          partnerAudioText: "Good morning team! Jonathan, could you give us a quick update on the payment API refactor? Any blockers?",
          options: [
            {
              label: 'Direto & Informal',
              text: "Hey Emma! I finished the main controller yesterday. No blockers right now, I'm testing the edge cases today.",
              score: 92,
              feedback: 'Excelente clareza! Frase natural e direta para reuniões ágeis.',
            },
            {
              label: 'Formal & Polido',
              text: "Good morning Emma. The implementation has reached 90% completion. I anticipate submitting the pull request by noon.",
              score: 96,
              feedback: 'Muito profissional! Excelente uso de vocabulário executivo ("anticipate submitting").',
            },
            {
              label: 'Com Dúvida / Alinhamento',
              text: "Morning! I hit a snag with the webhook retry logic. Could we sync for ten minutes after the standup?",
              score: 95,
              feedback: 'Excelente uso da expressão idiomática "hit a snag" (encontrei um obstáculo)!',
            },
          ],
        },
        {
          partnerSpeech: "Sounds great. Let's make sure we document the webhook payload in Swagger before pushing to staging.",
          partnerAudioText: "Sounds great. Let's make sure we document the webhook payload in Swagger before pushing to staging.",
          options: [
            {
              label: 'Confirmação Proativa',
              text: "Will do! I'll update the documentation and notify the team on Slack as soon as it's merged.",
              score: 98,
              feedback: 'Perfeito! "Will do" é a resposta favorita dos tech leads nativos.',
            },
            {
              label: 'Sugestão Colaborativa',
              text: "Understood. I can also add a couple of cURL examples to help frontend test easily.",
              score: 99,
              feedback: 'Excepcional postura proativa!',
            },
          ],
        },
      ],
    },
    {
      id: 'airport_travel',
      title: 'Imigração & Aeroporto Internacional',
      subtitle: 'Responda com segurança às perguntas do oficial na imigração em Londres ou Nova York.',
      tag: 'Travel & Lifestyle',
      partnerName: 'Officer Bradley (Border Control)',
      partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop',
      dialogues: [
        {
          partnerSpeech: "Good afternoon. Passport, please. What is the main purpose of your visit to the United Kingdom?",
          partnerAudioText: "Good afternoon. Passport, please. What is the main purpose of your visit to the United Kingdom?",
          options: [
            {
              label: 'Turismo & Férias',
              text: "Good afternoon, officer. Here it is. I'm visiting for tourism and sightseeing for two weeks.",
              score: 94,
              feedback: 'Firme, educado e sem hesitação.',
            },
            {
              label: 'Negócios / Conferência',
              text: "Here you go. I'm attending a technology conference in London, and then taking a few days of vacation.",
              score: 97,
              feedback: 'Excelente especificação! Mostra segurança e coerência.',
            },
          ],
        },
        {
          partnerSpeech: "Where will you be staying during your time in London, and do you have a return ticket booked?",
          partnerAudioText: "Where will you be staying during your time in London, and do you have a return ticket booked?",
          options: [
            {
              label: 'Apresentando Comprovantes',
              text: "I have a reservation at the CitizenM hotel near Shoreditch, and my return flight is booked for October 24th.",
              score: 98,
              feedback: 'Impecável! Resposta completa que evita perguntas adicionais do oficial.',
            },
          ],
        },
      ],
    },
    {
      id: 'coffee_networking',
      title: 'Networking & Casual Coffee Chat',
      subtitle: 'Inicie uma conversa agradável com um colega internacional sem ficar sem assunto.',
      tag: 'Conversação Geral',
      partnerName: 'Chloe (UX Designer)',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop',
      dialogues: [
        {
          partnerSpeech: "Hey! Is this seat taken? The café is pretty packed today! Are you working on something interesting?",
          partnerAudioText: "Hey! Is this seat taken? The cafe is pretty packed today! Are you working on something interesting?",
          options: [
            {
              label: 'Receptivo & Amigável',
              text: "Not at all, please take it! Yeah, I'm reviewing some software architectures. How about you?",
              score: 96,
              feedback: 'Excelente resposta natural com contra-pergunta simpática ("How about you?").',
            },
            {
              label: 'Espontâneo',
              text: "Go right ahead! Just finishing up some emails before my next call. Long day, huh?",
              score: 95,
              feedback: 'Muito natural o uso de "Go right ahead!" e "Long day, huh?".',
            },
          ],
        },
      ],
    },
  ];

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<{
    label: string;
    text: string;
    score: number;
    feedback: string;
  } | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Audio Speech Synthesis for interactive native playback
  const playNativeAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (opt: any) => {
    setSelectedOption(opt);
  };

  const handleNextStep = () => {
    if (currentStepIndex + 1 < currentScenario.dialogues.length) {
      setCurrentStepIndex(currentStepIndex + 1);
      setSelectedOption(null);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleResetScenario = () => {
    setCurrentStepIndex(0);
    setSelectedOption(null);
    setSessionCompleted(false);
  };

  // -------------------------------------------------------------
  // 2. CALCULADORA & RADAR DE MATCHING DINÂMICO
  // -------------------------------------------------------------
  const [calcBudget, setCalcBudget] = useState<number>(110);
  const [calcGoal, setCalcGoal] = useState<LearningGoal>(LearningGoal.Business);
  const [calcLevel, setCalcLevel] = useState<ProficiencyLevel>(ProficiencyLevel.B1_Intermediate);
  const [calcTimePref, setCalcTimePref] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');

  // Calculate live matching score for teachers
  const calculatedMatches = teachers.map((teacher) => {
    let score = 50;
    // Price match
    if (teacher.hourlyPriceBrl <= calcBudget) {
      score += 20;
    } else {
      score -= Math.min(25, Math.round((teacher.hourlyPriceBrl - calcBudget) * 0.5));
    }
    // Goal match
    if (teacher.specialties.includes(calcGoal)) {
      score += 20;
    }
    // Level match
    if (teacher.levelsTaught.includes(calcLevel)) {
      score += 15;
    }
    // Rating bonus
    score += Math.round(teacher.rating * 2);

    const clampedScore = Math.min(99, Math.max(35, score));
    return {
      teacher,
      affinity: clampedScore,
    };
  }).sort((a, b) => b.affinity - a.affinity);

  const bestMatch = calculatedMatches[0];

  // -------------------------------------------------------------
  // 3. FLASHCARDS & VOCABULARY ACCELERATOR
  // -------------------------------------------------------------
  const flashcards = [
    {
      id: 'fc-1',
      expression: 'Touch base',
      phonetics: '/tʌtʃ beɪs/',
      meaning: 'Entrar em contato brevemente para alinhar um assunto ou projeto.',
      exampleEn: "Let's touch base next Monday to review the sprint metrics.",
      examplePt: 'Vamos nos falar rapidamente na próxima segunda para revisar as métricas da sprint.',
      category: 'Business Idiom',
    },
    {
      id: 'fc-2',
      expression: 'Cut to the chase',
      phonetics: '/kʌt tuː ðə tʃeɪs/',
      meaning: 'Ir direto ao ponto, sem rodeios ou delongas.',
      exampleEn: "We don't have much time, so let's cut to the chase.",
      examplePt: 'Não temos muito tempo, então vamos direto ao que interessa.',
      category: 'Fluency Booster',
    },
    {
      id: 'fc-3',
      expression: 'Hit the ground running',
      phonetics: '/hɪt ðə ɡraʊnd ˈrʌnɪŋ/',
      meaning: 'Começar uma atividade com energia total e sem perder tempo.',
      exampleEn: "With her onboarding completed, she hit the ground running.",
      examplePt: 'Com seu treinamento finalizado, ela começou com força total.',
      category: 'Workplace English',
    },
  ];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(1);

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="space-y-6">
      {/* Interactive Hub Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-cyan-100">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span>Laboratório Prático Interativo do Aluno</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pratique Inglês em Situações Reais
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Simule conversas profissionais, teste pronúncia com áudio nativo, descubra seu matching dinâmico em tempo real e acelere sua fluência antes da próxima aula.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100 block">
              Sequência Ativa (Streak)
            </span>
            <div className="flex items-center justify-center gap-1 text-2xl font-black mt-1">
              <span>🔥 4 Dias</span>
            </div>
            <span className="text-[10px] text-cyan-200 mt-1 block">
              +15 pts de afinidade de matching
            </span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/20">
          <button
            onClick={() => setActiveInteractiveTab('roleplay')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeInteractiveTab === 'roleplay'
                ? 'bg-white text-blue-700 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Simulador de Situações Reais (Roleplay)</span>
          </button>

          <button
            onClick={() => setActiveInteractiveTab('matching_calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeInteractiveTab === 'matching_calculator'
                ? 'bg-white text-blue-700 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Calculadora & Radar de Matching</span>
          </button>

          <button
            onClick={() => setActiveInteractiveTab('flashcards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeInteractiveTab === 'flashcards'
                ? 'bg-white text-blue-700 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Expressões & Pronúncia Diária</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. ROLEPLAY STUDIO */}
      {/* ---------------------------------------------------------------- */}
      {activeInteractiveTab === 'roleplay' && (
        <div className="space-y-6">
          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  handleResetScenario();
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                  selectedScenarioId === sc.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <span className="block text-left font-bold">{sc.title}</span>
                <span className="text-[10px] text-neutral-400 font-normal">{sc.tag}</span>
              </button>
            ))}
          </div>

          {!sessionCompleted ? (
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Partner speech box */}
              <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-blue-100">
                <img
                  src={currentScenario.partnerAvatar}
                  alt={currentScenario.partnerName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-200 shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">
                      {currentScenario.partnerName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        playNativeAudio(
                          currentScenario.dialogues[currentStepIndex].partnerAudioText
                        )
                      }
                      className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <span>Ouvir em Inglês Nativo</span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-neutral-800 leading-relaxed italic bg-white p-3 rounded-xl border border-neutral-200">
                    "{currentScenario.dialogues[currentStepIndex].partnerSpeech}"
                  </p>
                  <span className="text-[11px] text-neutral-500 block">
                    Passo {currentStepIndex + 1} de {currentScenario.dialogues.length} • Selecione sua melhor resposta abaixo:
                  </span>
                </div>
              </div>

              {/* Student Response Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Como você responderia?
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {currentScenario.dialogues[currentStepIndex].options.map((opt, idx) => {
                    const isChosen = selectedOption?.text === opt.text;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                          isChosen
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                            {opt.label}
                          </span>
                          {isChosen && (
                            <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Nota {opt.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-neutral-900 mt-1">
                          "{opt.text}"
                        </p>
                        {isChosen && (
                          <div className="mt-2 pt-2 border-t border-blue-200/60 text-xs text-neutral-600 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                            <span>{opt.feedback}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetScenario}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Diálogo</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <span>
                    {currentStepIndex + 1 < currentScenario.dialogues.length
                      ? 'Próxima Frase'
                      : 'Ver Diagnóstico Final'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Completed Scenario Report */
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-xs text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <Award className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-black text-neutral-900">
                  Excelente Desempenho no Diálogo!
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Você concluiu a simulação de "{currentScenario.title}" demonstrando vocabulário contextual e clareza.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase">Fluência</span>
                  <span className="text-lg font-black text-blue-600">96%</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase">Vocabulário</span>
                  <span className="text-lg font-black text-cyan-600">Avançado</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-500 font-bold block uppercase">Bônus Talkê</span>
                  <span className="text-lg font-black text-emerald-600">+25 pts</span>
                </div>
              </div>

              {/* Recommended teacher for this scenario */}
              {bestMatch && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 max-w-xl mx-auto text-left flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={bestMatch.teacher.avatarUrl}
                      alt={bestMatch.teacher.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-300"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                        Professor Ideal para Praticar Esse Tópico
                      </span>
                      <h4 className="text-sm font-bold text-neutral-900">{bestMatch.teacher.name}</h4>
                      <p className="text-[11px] text-neutral-600">{bestMatch.teacher.headline}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onBookTeacher(bestMatch.teacher)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-90 shrink-0"
                  >
                    Agendar Aula
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetScenario}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Praticar Novamente
                </button>
                <button
                  type="button"
                  onClick={onGoToTeachers}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Ver Todos os Professores
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 2. CALCULADORA & RADAR DE MATCHING */}
      {/* ---------------------------------------------------------------- */}
      {activeInteractiveTab === 'matching_calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Ajuste Seus Critérios de Matching</h3>
              <p className="text-xs text-neutral-500">
                O algoritmo Talkê recalcula a afinidade instantaneamente conforme você ajusta os parâmetros.
              </p>
            </div>

            {/* Budget Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1">
                <span>Orçamento Máximo por Aula:</span>
                <span className="text-blue-600 font-extrabold text-sm">
                  R$ {calcBudget.toFixed(2).replace('.', ',')} / 50 min
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="150"
                step="5"
                value={calcBudget}
                onChange={(e) => setCalcBudget(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>R$ 60</span>
                <span>R$ 100</span>
                <span>R$ 150</span>
              </div>
            </div>

            {/* Goal Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Objetivo Prioritário:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { goal: LearningGoal.Business, label: 'Business & Tech' },
                  { goal: LearningGoal.Conversation, label: 'Conversação' },
                  { goal: LearningGoal.Travel, label: 'Viagens' },
                  { goal: LearningGoal.Exams, label: 'Exames (TOEFL)' },
                ].map((item) => (
                  <button
                    key={item.goal}
                    type="button"
                    onClick={() => setCalcGoal(item.goal)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      calcGoal === item.goal
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Seu Nível Atual Estimado:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { lvl: ProficiencyLevel.A1_Beginner, label: 'Iniciante (A1)' },
                  { lvl: ProficiencyLevel.B1_Intermediate, label: 'Intermediário (B1)' },
                  { lvl: ProficiencyLevel.C1_Advanced, label: 'Avançado (C1)' },
                ].map((item) => (
                  <button
                    key={item.lvl}
                    type="button"
                    onClick={() => setCalcLevel(item.lvl)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                      calcLevel === item.lvl
                        ? 'border-cyan-600 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-500/20 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Preference */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Turno Preferido para Aulas:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'morning', label: '🌅 Manhã' },
                  { id: 'afternoon', label: '☀️ Tarde' },
                  { id: 'evening', label: '🌙 Noite' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCalcTimePref(t.id as any)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      calcTimePref === t.id
                        ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results & Live Match Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Ranking de Compatibilidade em Tempo Real
                  </h3>
                  <span className="text-[11px] text-neutral-500">
                    {calculatedMatches.length} professores avaliados pelo algoritmo Talkê
                  </span>
                </div>
                <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-full">
                  Algoritmo DDD Ponderado
                </span>
              </div>

              <div className="space-y-3 mt-4">
                {calculatedMatches.map(({ teacher, affinity }, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={teacher.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isTop
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50/60 to-cyan-50/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={teacher.avatarUrl}
                          alt={teacher.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-neutral-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-neutral-900">{teacher.name}</h4>
                            {isTop && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                Melhor Escolha
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 line-clamp-1">{teacher.headline}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="font-black text-neutral-900">
                              R$ {teacher.hourlyPriceBrl.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-neutral-400">•</span>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{teacher.rating.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                            Afinidade
                          </span>
                          <span
                            className={`text-xl font-black ${
                              affinity >= 85 ? 'text-emerald-600' : 'text-blue-600'
                            }`}
                          >
                            {affinity}%
                          </span>
                        </div>

                        <button
                          onClick={() => onBookTeacher(teacher)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0"
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 3. FLASHCARDS & PRONÚNCIA DIÁRIA */}
      {/* ---------------------------------------------------------------- */}
      {activeInteractiveTab === 'flashcards' && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Acelerador de Vocabulário & Pronúncia Nativa
              </h3>
              <p className="text-xs text-neutral-500">
                Clique no cartão para revelar o significado em português e ouça a pronúncia com áudio autêntico.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-xl">
                Cartão {currentCardIndex + 1} de {flashcards.length}
              </span>
            </div>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer max-w-xl mx-auto min-h-[260px] p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/10 px-2.5 py-1 rounded-full text-cyan-300">
                {currentCard.category}
              </span>
              <span className="text-[11px] text-slate-400">
                {isFlipped ? 'Clique para ver o termo em inglês' : 'Clique para ver a tradução'}
              </span>
            </div>

            <div className="py-6 text-center space-y-2">
              {!isFlipped ? (
                <>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">
                    "{currentCard.expression}"
                  </h3>
                  <span className="font-mono text-sm text-cyan-300 block">
                    {currentCard.phonetics}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 italic">
                    {currentCard.exampleEn}
                  </p>
                </>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                    Significado & Uso Prático
                  </span>
                  <p className="text-lg font-bold text-white max-w-md mx-auto">
                    {currentCard.meaning}
                  </p>
                  <p className="text-xs text-slate-300 max-w-md mx-auto italic bg-white/10 p-3 rounded-xl">
                    "{currentCard.examplePt}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playNativeAudio(currentCard.expression + ". " + currentCard.exampleEn);
                }}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Pronúncia</span>
              </button>

              <span className="text-[10px] text-slate-400">
                Toque no card para alternar (flip)
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={currentCardIndex === 0}
              onClick={() => {
                setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() => {
                setMasteredCount((prev) => prev + 1);
                if (currentCardIndex + 1 < flashcards.length) {
                  setCurrentCardIndex((prev) => prev + 1);
                  setIsFlipped(false);
                } else {
                  alert('Parabéns! Você praticou todas as expressões de hoje. +10 pontos no Talkê!');
                }
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Marcar como Memorizado & Próximo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
