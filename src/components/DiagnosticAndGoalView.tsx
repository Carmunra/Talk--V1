import React, { useState } from 'react';
import { Target, Award, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
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
      question: "By this time next year, Sarah _____ her MBA degree in the UK.",
      options: ["will finish", "is finishing", "will have finished", "finishes"],
      correctIndex: 2,
    },
    {
      id: 5,
      level: ProficiencyLevel.C1_Advanced,
      question: "Hardly _____ the conference started when the power went out.",
      options: ["did", "had", "was", "has"],
      correctIndex: 1,
    },
  ];

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [calculatedLevel, setCalculatedLevel] = useState<ProficiencyLevel>(
    currentStudent.level || ProficiencyLevel.B1_Intermediate
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectOption = (optIdx: number) => {
    setAnswers({ ...answers, [currentQuestionIdx]: optIdx });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Evaluate results
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) {
          correctCount += 1;
        }
      });

      let evaluatedLevel = ProficiencyLevel.A1_Beginner;
      if (correctCount === 1) evaluatedLevel = ProficiencyLevel.A2_Elementary;
      else if (correctCount === 2) evaluatedLevel = ProficiencyLevel.B1_Intermediate;
      else if (correctCount === 3) evaluatedLevel = ProficiencyLevel.B2_Upper_Intermediate;
      else if (correctCount === 4) evaluatedLevel = ProficiencyLevel.C1_Advanced;
      else if (correctCount >= 5) evaluatedLevel = ProficiencyLevel.C2_Proficient;

      setCalculatedLevel(evaluatedLevel);
      setStep('result');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(calculatedLevel, selectedGoal, goalDescription);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Diagnóstico & Objetivo Talkê</h2>
            <p className="text-xs text-neutral-500">
              Personalize seu aprendizado para receber os melhores professores
            </p>
          </div>
        </div>

        {/* Badges for Steps */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'goal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            1. Definir Objetivo
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'quiz'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            2. Teste de Nível
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'result'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            3. Resultado & Matching
          </span>
        </div>
      </div>

      {/* STEP 1: DEFINIR OBJETIVO */}
      {step === 'goal' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Qual é o seu principal foco agora?</h3>
            <p className="text-xs text-neutral-500 mt-1">
              O algoritmo Talkê usará seu objetivo para encontrar professores com especialidade comprovada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(LearningGoalLabels).map(([key, label]) => {
              const g = key as LearningGoal;
              const isSelected = selectedGoal === g;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedGoal(g)}
                  className={`p-4 text-left rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Target className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-neutral-400'}`} />
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900">{label}</h4>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Conte mais sobre sua necessidade (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Gostaria de treinar apresentações corporativas para reuniões com times globais."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              className="w-full p-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <button
              onClick={() => setStep('quiz')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <span>Continuar para Diagnóstico de Nível</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TESTE DE NÍVEL (QUIZ) */}
      {step === 'quiz' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Questão {currentQuestionIdx + 1} de {questions.length}
              </span>
              <h3 className="text-lg font-bold text-neutral-900 mt-1">
                {questions[currentQuestionIdx].question}
              </h3>
            </div>
            <div className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-lg">
              {ProficiencyLevelLabels[questions[currentQuestionIdx].level].split(' - ')[0]}
            </div>
          </div>

          <div className="space-y-2.5">
            {questions[currentQuestionIdx].options.map((opt, optIdx) => {
              const isSelected = answers[currentQuestionIdx] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-3.5 text-left rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-400/20'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-neutral-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <button
              onClick={() => setStep('goal')}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-700"
            >
              Voltar ao objetivo
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={answers[currentQuestionIdx] === undefined}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span>{currentQuestionIdx === questions.length - 1 ? 'Concluir Teste' : 'Próxima'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTADO & MATCHING */}
      {step === 'result' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-black text-neutral-900">Diagnóstico Concluído com Sucesso!</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Analisamos seu perfil e encontramos o nível ideal para o seu ponto de partida.
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Seu Nível Estimado (CEFR):</span>
              <span className="font-bold text-blue-700">
                {ProficiencyLevelLabels[calculatedLevel]}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Objetivo Definido:</span>
              <span className="font-bold text-cyan-700">
                {LearningGoalLabels[selectedGoal]}
              </span>
            </div>

            {goalDescription && (
              <div className="text-left text-xs text-neutral-600 border-t border-neutral-200/60 pt-2 italic">
                "{goalDescription}"
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Perfil e Ver Professores Recomendados'}</span>
            </button>
            <button
              onClick={() => setStep('goal')}
              className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
