import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  BookmarkCheck,
  Calendar,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  CheckSquare,
  Square,
  MessageSquare,
  Eye,
  X,
  Target,
  User,
  Compass,
} from 'lucide-react';
import {
  Student,
  StudentDevelopmentRecord,
  ProficiencyLevel,
  ProficiencyLevelLabels,
  LearningGoalLabels,
  TalkeMaterialItem,
  TalkeModuleTier,
  Lesson,
  Teacher,
} from '../domain/types';
import { TALKE_CURRICULUM_MATERIALS } from '../data/talkeMaterials';
import { DEFAULT_STUDENT_PROGRESS } from '../data/defaultStudentProgress';
import { FirestoreService } from '../lib/firestoreService';

interface StudentProgressAndContentViewProps {
  currentStudent: Student;
  onGoToTeachers: () => void;
  onOpenPracticeLab?: () => void;
  lessons?: Lesson[];
  teachers?: Teacher[];
  onBookLesson?: () => void;
  onGoToClassroom?: (lesson: Lesson) => void;
}

export const StudentProgressAndContentView: React.FC<StudentProgressAndContentViewProps> = ({
  currentStudent,
  onGoToTeachers,
  onOpenPracticeLab,
  lessons = [],
  teachers = [],
  onBookLesson,
  onGoToClassroom,
}) => {
  const [studentRecord, setStudentRecord] = useState<StudentDevelopmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTierFilter, setSelectedTierFilter] = useState<'ALL' | TalkeModuleTier>('ALL');
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<TalkeMaterialItem | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [homeworkDone, setHomeworkDone] = useState(false);

  // Load student progress from Firestore or fallback to default
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const cloudRecords = await FirestoreService.getStudentProgressList();
        const found = cloudRecords.find(
          (r) => r.studentId === currentStudent.id || r.studentName.toLowerCase() === currentStudent.name.toLowerCase()
        );
        if (isMounted) {
          if (found) {
            setStudentRecord(found);
          } else {
            // Find in default progress or create initial for this student
            const defaultMatch = DEFAULT_STUDENT_PROGRESS.find(
              (r) => r.studentId === currentStudent.id || r.studentName.toLowerCase() === currentStudent.name.toLowerCase()
            );
            if (defaultMatch) {
              setStudentRecord(defaultMatch);
            } else {
              // Synthetic baseline record
              const fallback: StudentDevelopmentRecord = {
                id: `prog-${currentStudent.id}`,
                studentId: currentStudent.id,
                studentName: currentStudent.name,
                studentEmail: currentStudent.email,
                teacherId: 'tea-1',
                currentTier: 'BASICO',
                currentUnitNumber: 2,
                currentLessonTitle: 'Unidade 2: Conversas do Cotidiano & Rotina',
                checkpointStatus: 'Parou no Exercício 1: Daily routine e vocabulário de hábitos.',
                totalLessonsCompleted: currentStudent.totalLessonsCompleted || 4,
                totalHours: 3.5,
                lastLessonDate: 'Esta semana',
                cefrLevel: currentStudent.level || ProficiencyLevel.A2_Elementary,
                targetGoal: currentStudent.goal || ('' as any),
                grammarScorePct: 75,
                vocabularyScorePct: 82,
                pronunciationScorePct: 70,
                fluencyScorePct: 72,
                pedagogicalNotes: 'Excelente dedicação e compreensão auditiva. Foco atual em fixar o Simple Present sem hesitação na 3ª pessoa (he/she/it).',
                homeworkAssigned: 'Descrever em 3 frases a sua rotina matinal em inglês para a próxima aula.',
                nextRecommendedStep: 'Concluir a Unidade 2 e iniciar Simulação de Viagens e Aeroporto na Unidade 3.',
                strengths: ['Boa audição', 'Pronúncia clara dos sons vocálicos', 'Vontade de falar'],
                areasToImprove: ['Hesitação ao conjugar he/she/it', 'Uso de conectores simples (and, but, because)'],
                updatedAt: new Date().toISOString(),
              };
              setStudentRecord(fallback);
            }
          }
        }
      } catch (err) {
        console.warn('Fallback loading student progress:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [currentStudent]);

  const record = studentRecord;
  const currentUnit = record?.currentUnitNumber || 1;
  const currentTier = record?.currentTier || 'BASICO';

  // Filter materials
  const displayedMaterials = TALKE_CURRICULUM_MATERIALS.filter((mat) => {
    if (selectedTierFilter !== 'ALL' && mat.tier !== selectedTierFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner: Student Journey & Level */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Sua Jornada de Aprendizado Talkê</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-400 font-normal">Sincronizado com seus professores</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Conteúdos Aplicados & Onde Você Parou
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Aqui você acompanha todo o conteúdo pedagógico que já foi trabalhado nas suas aulas, o ponto exato de retomada, anotações dos professores e materiais para revisão.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20">
              <span className="text-[10px] text-cyan-300 uppercase font-bold block">Nível Atual</span>
              <span className="text-sm sm:text-base font-black text-white">
                {record?.cefrLevel ? ProficiencyLevelLabels[record.cefrLevel] : 'A2 - Elementar'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Aulas Concluídas</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">
                {record?.totalLessonsCompleted || currentStudent.totalLessonsCompleted || 0} Sessões
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20">
              <span className="text-[10px] text-amber-300 uppercase font-bold block">Horas Praticadas</span>
              <span className="text-sm sm:text-base font-black text-amber-300">
                {record?.totalHours || 4.5}h ao vivo
              </span>
            </div>
          </div>
        </div>

        {/* Radar of 4 Fluency Competencies */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Gramática</span>
              <span className="text-cyan-400 font-bold">{record?.grammarScorePct || 75}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${record?.grammarScorePct || 75}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Estruturação de frases</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Vocabulário</span>
              <span className="text-emerald-400 font-bold">{record?.vocabularyScorePct || 85}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${record?.vocabularyScorePct || 85}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Expressões & termos</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Pronúncia</span>
              <span className="text-amber-300 font-bold">{record?.pronunciationScorePct || 72}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${record?.pronunciationScorePct || 72}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Clareza e fonética</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Fluência & Destrave</span>
              <span className="text-blue-400 font-bold">{record?.fluencyScorePct || 78}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${record?.fluencyScorePct || 78}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Ritmo sem travar</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIGHLIGHT: WHERE YOU STOPPED (Onde Parei) & NEXT RECOMMENDED STEP */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Checkpoint Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-cyan-500/40 p-6 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-xs flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Ponto de Retomada</span>
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
              Trilha {record?.currentTier || 'Básico'} • Unidade {record?.currentUnitNumber || 3}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 mt-2">
              {record?.currentLessonTitle || 'Unidade 3: Viagens, Aeroporto & Sobrevivência no Exterior'}
            </h3>

            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs sm:text-sm">
              <span className="font-extrabold text-neutral-900 block mb-1 text-xs uppercase tracking-wide">
                📍 Onde você parou na última aula:
              </span>
              <p className="text-neutral-700 font-medium leading-relaxed">
                {record?.checkpointStatus ||
                  'Parou no Exercício 2: Simulação de imigração e alfândega. Próximo passo: pedidos em restaurantes.'}
              </p>
              <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Última atualização registrada pelo professor: <strong>{record?.lastLessonDate || 'Ontem'}</strong></span>
              </div>
            </div>
          </div>

          {/* Teacher's Pedagogical Notes */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Feedback Pedagógico do Professor:</span>
            </h4>
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-neutral-700 leading-relaxed italic">
              "{record?.pedagogicalNotes || 'Você demonstrou grande evolução em vocabulário e confiança para falar em frases completas!'}"
            </div>
          </div>

          {/* Strengths & Areas to Improve */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs">
              <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Seus Pontos Fortes:
              </span>
              <ul className="space-y-1 text-[11px] text-emerald-950">
                {(record?.strengths || ['Boa compreensão', 'Pronúncia clara', 'Vocabulário bem fixado']).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 text-xs">
              <span className="font-bold text-amber-800 flex items-center gap-1 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Foco para as Próximas Aulas:
              </span>
              <ul className="space-y-1 text-[11px] text-amber-950">
                {(record?.areasToImprove || ['Fixar Simple Past irregular', 'Reduzir pausas longas']).map((a, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onGoToTeachers}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Aula para Continuar</span>
            </button>

            <button
              type="button"
              onClick={onOpenPracticeLab}
              className="w-full sm:w-auto px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>Praticar no Laboratório Interativo</span>
            </button>
          </div>
        </div>

        {/* Right: Homework & Recommended Next Step */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Homework Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                <span>Tarefa de Casa da Última Aula</span>
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                homeworkDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {homeworkDone ? 'Concluída' : 'Pendente'}
              </span>
            </div>

            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-neutral-800 leading-relaxed">
              {record?.homeworkAssigned || 'Revisar os 5 verbos irregulares trabalhados e preparar 3 frases com Simple Past.'}
            </div>

            <button
              type="button"
              onClick={() => setHomeworkDone(!homeworkDone)}
              className="w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 border-neutral-200 hover:bg-neutral-50"
            >
              {homeworkDone ? (
                <>
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Marcado como Feito</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-700">Marcar Tarefa como Concluída</span>
                </>
              )}
            </button>
          </div>

          {/* Next Recommended Step */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-5 shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
              Próximo Passo Sugerido
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {record?.nextRecommendedStep || 'Concluir a simulação de alfândega e avançar para diálogos em restaurantes internacionais.'}
            </p>
            <div className="pt-2 text-[11px] text-cyan-300 font-bold flex items-center gap-1">
              <span>Seu professor continuará deste ponto exato!</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: CURRICULUM GRID - ALL MODULES & APPLIED LESSONS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Grade de Conteúdos Talkê: Aplicados & Próximos</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Clique em qualquer lição concluída para revisar os slides, o vocabulário e os exercícios aplicados em aula.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTierFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedTierFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Todos ({TALKE_CURRICULUM_MATERIALS.length})
            </button>
            <button
              onClick={() => setSelectedTierFilter('BASICO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedTierFilter === 'BASICO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Básico (A1/A2)
            </button>
            <button
              onClick={() => setSelectedTierFilter('INTERMEDIARIO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedTierFilter === 'INTERMEDIARIO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Intermediário (B1/B2)
            </button>
            <button
              onClick={() => setSelectedTierFilter('AVANCADO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedTierFilter === 'AVANCADO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Avançado (C1/C2)
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedMaterials.map((mat) => {
            // Determine status for current student
            const isCompleted =
              mat.tier === 'BASICO' && currentTier !== 'BASICO'
                ? true
                : mat.tier === currentTier
                ? mat.unitNumber < currentUnit
                : false;

            const isCurrent = mat.tier === currentTier && mat.unitNumber === currentUnit;
            const isUpcoming = !isCompleted && !isCurrent;

            return (
              <div
                key={mat.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-5 ${
                  isCurrent
                    ? 'border-2 border-cyan-500 shadow-md ring-2 ring-cyan-400/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/10 hover:border-emerald-300'
                    : 'border-neutral-200 hover:border-neutral-300 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                      {mat.tierLabel} • {mat.cefr}
                    </span>

                    {isCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Conteúdo Aplicado</span>
                      </span>
                    )}

                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 flex items-center gap-1 animate-pulse">
                        <Target className="w-3 h-3 text-cyan-600" />
                        <span>Em Andamento (Onde Parei)</span>
                      </span>
                    )}

                    {isUpcoming && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                        Próxima Lição
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 leading-snug">
                      Unidade {mat.unitNumber}: {mat.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                      {mat.objective}
                    </p>
                  </div>

                  {/* Vocabulary Pill preview */}
                  <div className="pt-2 border-t border-neutral-100">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                      Vocabulário-Chave:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {mat.vocabulary.slice(0, 3).map((v, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md"
                        >
                          {v}
                        </span>
                      ))}
                      {mat.vocabulary.length > 3 && (
                        <span className="text-[10px] text-neutral-400 px-1 py-0.5">
                          +{mat.vocabulary.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {mat.slides.length} slides didáticos
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaterialForDetail(mat);
                      setActiveSlideIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isCompleted || isCurrent
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Revisar Conteúdo' : 'Ver Detalhes'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INTERACTIVE SLIDE VIEWER & MATERIAL REVIEW FOR STUDENT */}
      {/* ========================================================================= */}
      {selectedMaterialForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                    {selectedMaterialForDetail.tierLabel} • Unidade {selectedMaterialForDetail.unitNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    Slide {activeSlideIndex + 1} de {selectedMaterialForDetail.slides.length}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {selectedMaterialForDetail.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMaterialForDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 sm:p-8 space-y-4 border border-cyan-500/20 shadow-md">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide block">
                  Tópico da Aula:
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  {selectedMaterialForDetail.slides[activeSlideIndex]?.title}
                </h4>

                <ul className="space-y-2 text-sm text-slate-200 pt-2">
                  {selectedMaterialForDetail.slides[activeSlideIndex]?.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {selectedMaterialForDetail.slides[activeSlideIndex]?.example && (
                  <div className="bg-white/10 border border-cyan-400/30 p-3.5 rounded-xl mt-4">
                    <span className="text-[10px] uppercase font-bold text-cyan-300 block mb-1">
                      Exemplo Prático Aplicado:
                    </span>
                    <p className="text-xs sm:text-sm italic text-white font-medium">
                      {selectedMaterialForDetail.slides[activeSlideIndex].example}
                    </p>
                  </div>
                )}

                {selectedMaterialForDetail.slides[activeSlideIndex]?.exercisePrompt && (
                  <div className="bg-emerald-500/20 border border-emerald-400/30 p-3 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-0.5">
                      Desafio Prático de Conversação:
                    </span>
                    <p className="text-xs text-emerald-100 font-semibold">
                      {selectedMaterialForDetail.slides[activeSlideIndex].exercisePrompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Vocabulary & Discussion in Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-neutral-900 block mb-1.5">
                    Vocabulário Fixado Nesta Lição:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedMaterialForDetail.vocabulary.map((v, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-neutral-700">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-xs">
                  <span className="font-bold text-blue-900 block mb-1.5">
                    Perguntas Trabalhadas com o Professor:
                  </span>
                  <ul className="space-y-1 text-[11px] text-blue-950">
                    {selectedMaterialForDetail.discussionQuestions.slice(0, 2).map((q, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>"{q}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Slide Navigation Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-bold disabled:opacity-30 hover:bg-neutral-100 transition-colors"
              >
                Slide Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {selectedMaterialForDetail.slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === activeSlideIndex ? 'w-6 bg-blue-600' : 'bg-neutral-300 hover:bg-neutral-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={activeSlideIndex === selectedMaterialForDetail.slides.length - 1}
                onClick={() => setActiveSlideIndex((prev) => Math.min(selectedMaterialForDetail.slides.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-30 hover:bg-blue-700 transition-colors"
              >
                Próximo Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
