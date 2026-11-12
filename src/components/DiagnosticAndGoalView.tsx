import React, { useState } from 'react';
import { Target, Award, ArrowRight, Sparkles, Zap, Check } from 'lucide-react';
import {
  Student,
  ProficiencyLevel,
  ProficiencyLevelLabels,
  LearningGoal,
  LearningGoalLabels,
} from '../domain/types';

interface DiagnosticAndGoalViewProps {
  currentStudent: Student;
  onSave: (level: ProficiencyLevel, goal: LearningGoal, goalDescription: string) => Promise<void>;
  onGoToTeachers: () => void;
}

interface Question {
  id: number;
  level: ProficiencyLevel;
  question: string;
  context?: string;
  options: string[];
  correctIndex: number;
}

export const DiagnosticAndGoalView: React.FC<DiagnosticAndGoalViewProps> = ({
  currentStudent,
  onSave,
  onGoToTeachers,
}) => {
  const [step, setStep] = useState<'goal' | 'quiz' | 'result'>('goal');

  // Goal Form State
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal>(
    currentStudent.goal || LearningGoal.Conversation
  );
  const [goalDescription, setGoalDescription] = useState<string>(
    currentStudent.goalDescription || ''
  );

  // Quiz State
  const questions: Question[] = [
    {
      id: 1,
      level: ProficiencyLevel.A1_Beginner,
      question: "Complete: 'Where _____ you from?'",
      options: ["is", "are", "do", "am"],
      correctIndex: 1,
    },
    {
      id: 2,
      level: ProficiencyLevel.A2_Elementary,
      question: "Yesterday we _____ to the beach, but it started to rain.",
      options: ["go", "went", "gone", "was going"],
      correctIndex: 1,
    },
    {
      id: 3,
      level: ProficiencyLevel.B1_Intermediate,
      question: "If I _____ more free time, I would study English every day.",
      options: ["have", "had", "will have", "would have"],
      correctIndex: 1,
    },
    {
      id: 4,
      level: ProficiencyLevel.B2_Upper_Intermediate,
      question: "By the time the meeting ends, we _____ all the quarterly goals.",
      options: ["will discuss", "will have discussed", "had discussed", "have been discussing"],
      correctIndex: 1,
    },
    {
      id: 5,
      level: ProficiencyLevel.C1_Advanced,
      question: "Seldom _____ such an articulate presentation on complex macroeconomics.",
      options: ["I have witnessed", "have I witnessed", "I had witnessed", "did I witnessed"],
      correctIndex: 1,
    },
  ];

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [calculatedLevel, setCalculatedLevel] = useState<ProficiencyLevel>(
    currentStudent.level || ProficiencyLevel.A1_Beginner
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Calculate score & level
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) {
          correctCount++;
        }
      });

      let level = ProficiencyLevel.A1_Beginner;
      if (correctCount === 1) level = ProficiencyLevel.A1_Beginner;
      else if (correctCount === 2) level = ProficiencyLevel.A2_Elementary;
      else if (correctCount === 3) level = ProficiencyLevel.B1_Intermediate;
      else if (correctCount === 4) level = ProficiencyLevel.B2_Upper_Intermediate;
      else if (correctCount >= 5) level = ProficiencyLevel.C1_Advanced;

      setCalculatedLevel(level);
      setStep('result');
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await onSave(calculatedLevel, selectedGoal, goalDescription);
      onGoToTeachers();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stepper Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase block">
              Talkê • Avaliação Diagnóstica
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Diagnóstico & Nivelamento CEFR</h2>
            <p className="text-xs text-slate-500">
              Personalize sua meta de conversação para receber recomendações de professores ideais
            </p>
          </div>
        </div>

        {/* Badges for Steps */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 'goal'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            1. Objetivo
          </span>
          <span
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 'quiz'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            2. Teste CEFR
          </span>
          <span
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 'result'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            3. Resultado
          </span>
        </div>
      </div>

      {/* STEP 1: DEFINIR OBJETIVO */}
      {step === 'goal' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Etapa 01 de 03
            </span>
            <h3 className="text-xl font-black text-slate-900">Qual é o seu principal foco agora?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              O algoritmo do Talkê usará seu objetivo para calcular a compatibilidade com professores especialistas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(LearningGoalLabels).map(([key, label]) => {
              const g = key as LearningGoal;
              const isSelected = selectedGoal === g;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedGoal(g)}
                  className={`p-4 text-left rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Target className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    {isSelected && (
                      <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{label}</h4>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Conte mais sobre sua necessidade específica (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Gostaria de treinar apresentações corporativas para reuniões com times globais em tecnologia."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep('quiz')}
              className="ed-btn-primary px-6 py-3 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar para o Teste CEFR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TESTE DE NÍVEL (QUIZ) */}
      {step === 'quiz' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                Questão {currentQuestionIdx + 1} de {questions.length}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {questions[currentQuestionIdx].question}
              </h3>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
              {ProficiencyLevelLabels[questions[currentQuestionIdx].level].split(' - ')[0]}
            </div>
          </div>

          <div className="space-y-3">
            {questions[currentQuestionIdx].options.map((opt, optIdx) => {
              const isSelected = answers[currentQuestionIdx] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 text-left rounded-2xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{opt}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep('goal')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              ← Voltar ao objetivo
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={answers[currentQuestionIdx] === undefined}
              className="ed-btn-primary px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <span>{currentQuestionIdx === questions.length - 1 ? 'Concluir Diagnóstico' : 'Próxima Questão'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTADO & MATCHING */}
      {step === 'result' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 space-y-6 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-700 block mb-1">
              Diagnóstico Concluído com Sucesso
            </span>
            <h3 className="text-2xl font-black text-slate-900">Seu Nível e Rota Pedagógica</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Seu perfil foi processado e calculamos a pontuação de compatibilidade com os professores ativos.
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Nível Estimado (CEFR):</span>
              <span className="font-extrabold text-blue-600 text-sm">
                {ProficiencyLevelLabels[calculatedLevel]}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Foco Selecionado:</span>
              <span className="font-extrabold text-emerald-700">
                {LearningGoalLabels[selectedGoal]}
              </span>
            </div>

            {goalDescription && (
              <div className="text-slate-600 border-t border-slate-200 pt-2 text-xs italic">
                "{goalDescription}"
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full sm:w-auto ed-btn-primary px-8 py-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Perfil e Ver Professores'}</span>
            </button>
            <button
              onClick={() => setStep('goal')}
              className="w-full sm:w-auto ed-btn-outline px-5 py-3.5 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Refazer Diagnóstico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
