import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle,
  RotateCcw,
  Sliders,
  Award,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Zap,
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
  currentStudent: _currentStudent,
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
              feedback: 'Perfeito para reportes corporativos executivos e apresentações formais.',
            },
            {
              label: 'Precisando de Ajuda',
              text: "Hi Emma. I'm facing an issue with the webhook payload validation. Could we do a quick 10-minute sync after standup?",
              score: 95,
              feedback: 'Ótima proatividade ao sinalizar o impedimento e pedir alinhamento ágil.',
            },
          ],
        },
      ],
    },
    {
      id: 'airport_immigration',
      title: 'Controle de Imigração',
      subtitle: 'Responda com confiança às perguntas do oficial de fronteira ao entrar no Reino Unido.',
      tag: 'Viagens & Turismo',
      partnerName: 'Officer Davis (Border Force)',
      partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop',
      dialogues: [
        {
          partnerSpeech: "Good afternoon. Passport, please. What is the primary purpose of your visit to the United Kingdom?",
          partnerAudioText: "Good afternoon. Passport, please. What is the primary purpose of your visit to the United Kingdom?",
          options: [
            {
              label: 'Turismo e Férias',
              text: "Good afternoon, officer. Here you go. I'm here on holiday for two weeks to visit London and Edinburgh.",
              score: 98,
              feedback: 'Excelente! Claro, educado ("Here you go") e com duração exata declarada.',
            },
            {
              label: 'Conferência de Trabalho',
              text: "Hello! I am attending a 3-day tech conference in London, and then taking a couple of days to travel before flying home.",
              score: 94,
              feedback: 'Muito bom! Deixa claro o motivo profissional e o retorno programado.',
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
  const [_calcTimePref, setCalcTimePref] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');

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
      score += 10;
    }
    return {
      teacher,
      affinity: Math.max(45, Math.min(99, score)),
    };
  }).sort((a, b) => b.affinity - a.affinity);

  const bestMatch = calculatedMatches[0];

  // -------------------------------------------------------------
  // 3. FLASHCARDS INTERATIVOS & EXPRESSÕES DO DIA
  // -------------------------------------------------------------
  const flashcards = [
    {
      expression: 'Cut to the chase',
      phonetics: '/kʌt tu ðə tʃeɪs/',
      meaning: 'Ir direto ao ponto, sem rodeios.',
      exampleEn: "We only have 15 minutes, so let's cut to the chase.",
      examplePt: 'Nós temos apenas 15 minutos, então vamos direto ao ponto.',
      category: 'Business & Meetings',
    },
    {
      expression: 'Touch base',
      phonetics: '/tʌtʃ beɪs/',
      meaning: 'Entrar em contato brevemente para se atualizar.',
      exampleEn: "Let's touch base tomorrow morning after the release.",
      examplePt: 'Vamos nos falar rapidamente amanhã de manhã após o lançamento.',
      category: 'Tech & Agile',
    },
    {
      expression: 'Play it by ear',
      phonetics: '/pleɪ ɪt baɪ ɪər/',
      meaning: 'Decidir na hora, improvisar conforme a situação.',
      exampleEn: "We don't have a strict itinerary, we'll play it by ear.",
      examplePt: 'Não temos um roteiro rígido, vamos decidir na hora.',
      category: 'Travel & Casual',
    },
  ];

  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [_masteredCount, setMasteredCount] = useState<number>(0);

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Interactive Hub Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full text-xs font-bold text-blue-600">
              <Zap className="w-3.5 h-3.5" />
              <span>Laboratório Prático Interativo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Pratique Inglês em Situações Reais
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Simule conversas corporativas, treine sua pronúncia com áudio autêntico e descubra o professor com maior afinidade para seus objetivos.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Sequência Ativa (Streak)
            </span>
            <div className="flex items-center justify-center gap-1 text-2xl font-black mt-1 text-amber-500">
              <span>🔥 4 Dias</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 mt-1 block">
              +15 pts de afinidade
            </span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveInteractiveTab('roleplay')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeInteractiveTab === 'roleplay'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Simulador de Situações (Roleplay)</span>
          </button>

          <button
            onClick={() => setActiveInteractiveTab('matching_calculator')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeInteractiveTab === 'matching_calculator'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Calculadora & Radar de Matching</span>
          </button>

          <button
            onClick={() => setActiveInteractiveTab('flashcards')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeInteractiveTab === 'flashcards'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Expressões & Pronúncia</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. ROLEPLAY STUDIO */}
      {/* ---------------------------------------------------------------- */}
      {activeInteractiveTab === 'roleplay' && (
        <div className="space-y-6">
          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  handleResetScenario();
                }}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                  selectedScenarioId === sc.id
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-left font-bold text-slate-900">{sc.title}</span>
                <span className="text-[11px] text-slate-500 font-medium">{sc.tag}</span>
              </button>
            ))}
          </div>

          {!sessionCompleted ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Partner speech box */}
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={currentScenario.partnerAvatar}
                  alt={currentScenario.partnerName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100 shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {currentScenario.partnerName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        playNativeAudio(
                          currentScenario.dialogues[currentStepIndex].partnerAudioText
                        )
                      }
                      className="px-3 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <span>Ouvir em Inglês Nativo</span>
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed italic bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                    "{currentScenario.dialogues[currentStepIndex].partnerSpeech}"
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Passo {currentStepIndex + 1} de {currentScenario.dialogues.length} • Selecione sua melhor resposta:
                  </span>
                </div>
              </div>

              {/* Student Response Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                          isChosen
                            ? 'border-blue-600 bg-blue-50/70 text-slate-900 shadow-sm ring-1 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isChosen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {opt.label}
                          </span>
                          {isChosen && (
                            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Nota {opt.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                          "{opt.text}"
                        </p>
                        {isChosen && (
                          <div className="mt-2.5 pt-2 border-t border-blue-100 text-xs text-slate-600 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{opt.feedback}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetScenario}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Diálogo</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-40 cursor-pointer transition-colors"
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
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Excelente Desempenho no Diálogo!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Você concluiu a simulação de "{currentScenario.title}" demonstrando vocabulário contextual, clareza e desenvoltura.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Fluência</span>
                  <span className="text-lg font-black text-blue-600">96%</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Vocabulário</span>
                  <span className="text-lg font-black text-indigo-600">Avançado</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Bônus Talkê</span>
                  <span className="text-lg font-black text-emerald-600">+25 pts</span>
                </div>
              </div>

              {/* Recommended teacher for this scenario */}
              {bestMatch && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-blue-200 max-w-xl mx-auto text-left flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={bestMatch.teacher.avatarUrl}
                      alt={bestMatch.teacher.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        Professor Recomendado
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{bestMatch.teacher.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{bestMatch.teacher.headline}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onBookTeacher(bestMatch.teacher)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shrink-0 cursor-pointer transition-colors"
                  >
                    Agendar Aula
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetScenario}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer hover:bg-slate-100"
                >
                  Praticar Novamente
                </button>
                <button
                  type="button"
                  onClick={onGoToTeachers}
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
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
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Critérios de Matching Talkê</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                O algoritmo recalcula a afinidade instantaneamente conforme você ajusta os filtros.
              </p>
            </div>

            {/* Budget Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Orçamento Máximo:</span>
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                <span>R$ 60</span>
                <span>R$ 100</span>
                <span>R$ 150</span>
              </div>
            </div>

            {/* Goal Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
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
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      calcGoal === item.goal
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                Seu Nível Estimado:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { lvl: ProficiencyLevel.A1_Beginner, label: 'A1 - Básico' },
                  { lvl: ProficiencyLevel.B1_Intermediate, label: 'B1 - Interm.' },
                  { lvl: ProficiencyLevel.C1_Advanced, label: 'C1 - Avançado' },
                ].map((item) => (
                  <button
                    key={item.lvl}
                    type="button"
                    onClick={() => setCalcLevel(item.lvl)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                      calcLevel === item.lvl
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                Turno Preferido:
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
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      _calcTimePref === t.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
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
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ranking de Compatibilidade em Tempo Real
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {calculatedMatches.length} professores ponderados pelo algoritmo
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  Algoritmo Talkê
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
                          ? 'border-blue-300 bg-blue-50/40 shadow-xs ring-1 ring-blue-400/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={teacher.avatarUrl}
                          alt={teacher.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{teacher.name}</h4>
                            {isTop && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                Melhor Escolha
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{teacher.headline}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="font-extrabold text-slate-900">
                              R$ {teacher.hourlyPriceBrl.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{teacher.rating.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-100 sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
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
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer transition-colors"
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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Vocabulário & Pronúncia Autêntica
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Toque no cartão para revelar o significado e ouça o áudio com pronúncia nativa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                Cartão {currentCardIndex + 1} de {flashcards.length}
              </span>
            </div>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer max-w-xl mx-auto min-h-[260px] p-8 rounded-3xl bg-gradient-to-b from-blue-50/60 to-white border-2 border-blue-200 text-slate-900 shadow-md flex flex-col justify-between transition-all hover:shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                {currentCard.category}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {isFlipped ? 'Clique para ver em inglês' : 'Clique para ver a tradução'}
              </span>
            </div>

            <div className="py-6 text-center space-y-2">
              {!isFlipped ? (
                <>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                    "{currentCard.expression}"
                  </h3>
                  <span className="text-sm font-semibold text-blue-600 block">
                    {currentCard.phonetics}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 italic">
                    {currentCard.exampleEn}
                  </p>
                </>
              ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                    Significado & Uso Prático
                  </span>
                  <p className="text-lg font-bold text-slate-900 max-w-md mx-auto">
                    {currentCard.meaning}
                  </p>
                  <p className="text-xs text-slate-600 max-w-md mx-auto italic bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    "{currentCard.examplePt}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playNativeAudio(currentCard.expression + ". " + currentCard.exampleEn);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Pronúncia</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium">
                Toque no card para virar
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
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer bg-white shadow-xs"
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
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
