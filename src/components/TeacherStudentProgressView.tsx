import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Clock,
  Award,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
  FileText,
  Calendar,
  Layers,
  Database,
  RefreshCw,
  Plus,
  MessageSquare,
  BookmarkCheck,
} from 'lucide-react';
import {
  Teacher,
  StudentDevelopmentRecord,
  ProficiencyLevelLabels,
  LearningGoalLabels,
  TalkeModuleTier,
} from '../domain/types';
import { DEFAULT_STUDENT_PROGRESS } from '../data/defaultStudentProgress';
import { FirestoreService } from '../lib/firestoreService';

interface TeacherStudentProgressViewProps {
  currentTeacher: Teacher;
  onOpenMaterial?: (tier: TalkeModuleTier, unitNumber: number) => void;
  onOpenClassroomWithStudent?: (studentName: string) => void;
}

export const TeacherStudentProgressView: React.FC<TeacherStudentProgressViewProps> = ({
  currentTeacher,
  onOpenMaterial,
}) => {
  const [records, setRecords] = useState<StudentDevelopmentRecord[]>(DEFAULT_STUDENT_PROGRESS);
  const [selectedRecordId, setSelectedRecordId] = useState<string>(DEFAULT_STUDENT_PROGRESS[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | TalkeModuleTier>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editCheckpoint, setEditCheckpoint] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editHomework, setEditHomework] = useState('');
  const [editNextStep, setEditNextStep] = useState('');
  const [editTier, setEditTier] = useState<TalkeModuleTier>('BASICO');
  const [editUnitNum, setEditUnitNum] = useState(1);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editGrammarScore, setEditGrammarScore] = useState(80);
  const [editVocabScore, setEditVocabScore] = useState(85);
  const [editPronunScore, setEditPronunScore] = useState(75);
  const [editFluencyScore, setEditFluencyScore] = useState(80);

  // Load from Firestore or subscribe
  useEffect(() => {
    let isMounted = true;
    const loadFromCloud = async () => {
      const cloudRecords = await FirestoreService.getStudentProgressList();
      if (isMounted && cloudRecords && cloudRecords.length > 0) {
        setRecords(cloudRecords);
        if (!cloudRecords.some((r) => r.id === selectedRecordId)) {
          setSelectedRecordId(cloudRecords[0].id);
        }
      }
    };

    loadFromCloud();

    const unsubscribe = FirestoreService.subscribeToStudentProgress((liveRecords) => {
      if (isMounted && liveRecords && liveRecords.length > 0) {
        setRecords(liveRecords);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Sync edit form when selected record changes
  useEffect(() => {
    if (selectedRecord) {
      setEditCheckpoint(selectedRecord.checkpointStatus || '');
      setEditNotes(selectedRecord.pedagogicalNotes || '');
      setEditHomework(selectedRecord.homeworkAssigned || '');
      setEditNextStep(selectedRecord.nextRecommendedStep || '');
      setEditTier(selectedRecord.currentTier || 'BASICO');
      setEditUnitNum(selectedRecord.currentUnitNumber || 1);
      setEditLessonTitle(selectedRecord.currentLessonTitle || '');
      setEditGrammarScore(selectedRecord.grammarScorePct || 80);
      setEditVocabScore(selectedRecord.vocabularyScorePct || 80);
      setEditPronunScore(selectedRecord.pronunciationScorePct || 80);
      setEditFluencyScore(selectedRecord.fluencyScorePct || 80);
      setIsEditing(false);
      setSaveSuccessMsg(null);
    }
  }, [selectedRecordId]);

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);

    const updated: StudentDevelopmentRecord = {
      ...selectedRecord,
      checkpointStatus: editCheckpoint,
      pedagogicalNotes: editNotes,
      homeworkAssigned: editHomework,
      nextRecommendedStep: editNextStep,
      currentTier: editTier,
      currentUnitNumber: editUnitNum,
      currentLessonTitle: editLessonTitle || `Unidade ${editUnitNum}`,
      grammarScorePct: editGrammarScore,
      vocabularyScorePct: editVocabScore,
      pronunciationScorePct: editPronunScore,
      fluencyScorePct: editFluencyScore,
      updatedAt: new Date().toISOString(),
    };

    // Update locally
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

    // Persist in Firestore
    await FirestoreService.saveStudentProgress(updated);

    setIsSaving(false);
    setIsEditing(false);
    setSaveSuccessMsg('Desenvolvimento do aluno atualizado e salvo com sucesso na nuvem!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.currentLessonTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || r.currentTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-blue-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Acompanhamento Pedagógico dos Alunos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xs border border-emerald-400/30">
              <Database className="w-3 h-3" />
              <span>Sincronizado no Cloud Firestore</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Desenvolvimento Individual & Checkpoints
          </h2>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Consulte exatamente onde cada aluno parou, quais exercícios faltam concluir, nível de domínio em gramática/vocabulário/pronúncia, tarefas de casa atribuídas e anotações para a próxima aula.
          </p>
        </div>

        <div className="shrink-0 relative z-10 flex flex-col sm:items-end gap-2">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 text-center sm:text-right">
            <span className="text-[11px] text-slate-300 block">Total de Alunos em Acompanhamento</span>
            <span className="text-2xl font-black text-cyan-300">{records.length} alunos</span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Prontuário Salvo</p>
            <p className="text-emerald-700 mt-0.5">{saveSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Student List on Left, Detailed Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Student Selector with Search & Filter */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Selecione o Aluno</span>
              </h3>
              <span className="text-[10px] text-neutral-500 font-medium">
                {filteredRecords.length} resultado(s)
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou lição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tier Filter Badges */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTierFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                  tierFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('BASICO')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                  tierFilter === 'BASICO'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Básico (A1/A2)
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('INTERMEDIARIO')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                  tierFilter === 'INTERMEDIARIO'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Interm. (B1/B2)
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('AVANCADO')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                  tierFilter === 'AVANCADO'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Avançado (C1/C2)
              </button>
            </div>
          </div>

          {/* Student Cards List */}
          <div className="space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-xs text-neutral-400">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredRecords.map((record) => {
                const isSelected = record.id === selectedRecord?.id;
                const tierColor =
                  record.currentTier === 'BASICO'
                    ? 'bg-emerald-100 text-emerald-800'
                    : record.currentTier === 'INTERMEDIARIO'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800';

                return (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecordId(record.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {record.studentName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                            {record.studentName}
                          </h4>
                          <span className="text-[10px] text-neutral-500 block mt-0.5">
                            {ProficiencyLevelLabels[record.cefrLevel]}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 ${tierColor}`}>
                        {record.currentTier}
                      </span>
                    </div>

                    {/* Where stopped snippet */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 truncate">
                        <BookmarkCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{record.currentLessonTitle}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {record.checkpointStatus}
                      </p>
                    </div>

                    {/* Footer stats */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                      <span>{record.totalLessonsCompleted} aulas ({record.totalHours}h)</span>
                      <span>{record.lastLessonDate}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Comprehensive Dossier & Live Editor */}
        {selectedRecord && (
          <div className="lg:col-span-8 space-y-6">
            {/* Student Header Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                    {selectedRecord.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-neutral-900">
                        {selectedRecord.studentName}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Nível {ProficiencyLevelLabels[selectedRecord.cefrLevel]}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Meta do Aluno: <strong>{LearningGoalLabels[selectedRecord.targetGoal]}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Atualizar Onde Parou & Notas</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </div>

              {/* Checkpoint Highlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookmarkCheck className="w-4 h-4 text-blue-600" />
                    Checkpoint Atual • Onde o Aluno Parou
                  </span>
                  <span className="text-[10px] font-bold bg-white text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                    Módulo {selectedRecord.currentTier}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-neutral-900">
                  {selectedRecord.currentLessonTitle}
                </h4>

                <p className="text-xs text-neutral-700 leading-relaxed font-medium bg-white/70 p-3 rounded-lg border border-blue-100">
                  {selectedRecord.checkpointStatus}
                </p>

                {onOpenMaterial && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenMaterial(selectedRecord.currentTier, selectedRecord.currentUnitNumber)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir Material Didático Desta Lição</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Competency Mastery Metrics (Grammar, Vocab, Pronunciation, Fluency) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Matriz de Domínio Linguístico</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Grammar */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">Gramática & Estrutura</span>
                      <span className="font-black text-blue-700">{selectedRecord.grammarScorePct}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${selectedRecord.grammarScorePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Vocabulary */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">Vocabulário Ativo</span>
                      <span className="font-black text-emerald-700">{selectedRecord.vocabularyScorePct}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${selectedRecord.vocabularyScorePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Pronunciation */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">Pronúncia & Fonética</span>
                      <span className="font-black text-purple-700">{selectedRecord.pronunciationScorePct}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${selectedRecord.pronunciationScorePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Fluency */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">Fluência & Destrave</span>
                      <span className="font-black text-teal-700">{selectedRecord.fluencyScorePct}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${selectedRecord.fluencyScorePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Areas to Improve */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pontos Fortes Demonstrados
                  </span>
                  <ul className="space-y-1 text-xs text-neutral-700">
                    {selectedRecord.strengths?.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <span className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Focos de Próxima Evolução
                  </span>
                  <ul className="space-y-1 text-xs text-neutral-700">
                    {selectedRecord.areasToImprove?.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pedagogical Notes & Homework Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Prontuário & Observações Pedagógicas</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {selectedRecord.pedagogicalNotes}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Tarefa de Casa (Homework) Atribuída</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {selectedRecord.homeworkAssigned || 'Nenhuma tarefa pendente no momento.'}
                  </p>
                </div>
              </div>
            </div>

            {/* LIVE EDIT FORM MODAL / EXPANDABLE PANEL */}
            {isEditing && (
              <form
                onSubmit={handleSaveProgress}
                className="bg-white rounded-2xl border-2 border-blue-500 p-6 shadow-md space-y-5 animate-fadeIn"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Atualizar Registro Pedagógico de {selectedRecord.studentName}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">Gravado diretamente no Firestore</span>
                </div>

                {/* Where stopped (Checkpoint) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Exatamente em que ponto/exercício o aluno parou?
                  </label>
                  <input
                    type="text"
                    value={editCheckpoint}
                    onChange={(e) => setEditCheckpoint(e.target.value)}
                    placeholder="Ex: Parou no exercício 3 de conversação sobre aeroporto..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Module Tier & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Módulo Talkê
                    </label>
                    <select
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value as TalkeModuleTier)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="BASICO">Básico (A1 / A2)</option>
                      <option value="INTERMEDIARIO">Intermediário (B1 / B2)</option>
                      <option value="AVANCADO">Avançado (C1 / C2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Número da Unidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={editUnitNum}
                      onChange={(e) => setEditUnitNum(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Título da Lição
                    </label>
                    <input
                      type="text"
                      value={editLessonTitle}
                      onChange={(e) => setEditLessonTitle(e.target.value)}
                      placeholder="Ex: Unidade 3: Viagens e Aeroporto"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Scores Sliders */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-800">
                    Ajustar Pontuação de Competências (0 a 100%)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <div>
                      <span className="text-[11px] text-neutral-600 block">Gramática: {editGrammarScore}%</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={editGrammarScore}
                        onChange={(e) => setEditGrammarScore(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-600 block">Vocabulário: {editVocabScore}%</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={editVocabScore}
                        onChange={(e) => setEditVocabScore(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-600 block">Pronúncia: {editPronunScore}%</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={editPronunScore}
                        onChange={(e) => setEditPronunScore(Number(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-600 block">Fluência: {editFluencyScore}%</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={editFluencyScore}
                        onChange={(e) => setEditFluencyScore(Number(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Pedagogical Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Anotações Pedagógicas para a Próxima Aula
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Descreva o desempenho do aluno, principais dúvidas e correções feitas..."
                    className="w-full p-3 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Homework Assigned */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Tarefa de Casa (Homework) Atribuída
                  </label>
                  <input
                    type="text"
                    value={editHomework}
                    onChange={(e) => setEditHomework(e.target.value)}
                    placeholder="Ex: Gravar um áudio de 45 segundos simulando check-in de hotel..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando no Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
