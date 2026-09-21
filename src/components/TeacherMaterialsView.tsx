import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Presentation,
  UserCheck,
  Clock,
  Award,
  FileText,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  X,
  Share2,
} from 'lucide-react';
import { TalkeMaterialItem, TalkeModuleTier, StudentDevelopmentRecord } from '../domain/types';
import { TALKE_CURRICULUM_MATERIALS } from '../data/talkeMaterials';
import { DEFAULT_STUDENT_PROGRESS } from '../data/defaultStudentProgress';
import { FirestoreService } from '../lib/firestoreService';

interface TeacherMaterialsViewProps {
  initialTier?: TalkeModuleTier;
  initialUnitNumber?: number;
  onLaunchVirtualClassroomWithMaterial?: (material: TalkeMaterialItem) => void;
}

export const TeacherMaterialsView: React.FC<TeacherMaterialsViewProps> = ({
  initialTier,
  initialUnitNumber,
  onLaunchVirtualClassroomWithMaterial,
}) => {
  const [selectedTier, setSelectedTier] = useState<'ALL' | TalkeModuleTier>(initialTier || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalMaterial, setActiveModalMaterial] = useState<TalkeMaterialItem | null>(() => {
    if (initialTier && initialUnitNumber) {
      return (
        TALKE_CURRICULUM_MATERIALS.find(
          (m) => m.tier === initialTier && m.unitNumber === initialUnitNumber
        ) || null
      );
    }
    return null;
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<string>('stu-1');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

  // Filter materials
  const filteredMaterials = TALKE_CURRICULUM_MATERIALS.filter((mat) => {
    const matchesTier = selectedTier === 'ALL' || mat.tier === selectedTier;
    const matchesSearch =
      mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.grammarFocus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.vocabulary.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mat.objective.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(`"${label}" copiado com sucesso!`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleAssignToStudent = async (material: TalkeMaterialItem) => {
    const student = DEFAULT_STUDENT_PROGRESS.find((s) => s.studentId === assignStudentId);
    if (!student) return;

    const updated: StudentDevelopmentRecord = {
      ...student,
      currentTier: material.tier,
      currentUnitNumber: material.unitNumber,
      currentLessonTitle: material.title,
      checkpointStatus: `Atribuído pelo professor: Início da ${material.title}. Foco: ${material.grammarFocus}.`,
      homeworkAssigned: material.homeworkIdea,
      nextRecommendedStep: `Completar slides e exercícios da ${material.title}.`,
      updatedAt: new Date().toISOString(),
    };

    await FirestoreService.saveStudentProgress(updated);
    setAssignSuccessMsg(`Lição atribuída com sucesso para o aluno ${student.studentName}!`);
    setTimeout(() => setAssignSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-blue-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Plano Curricular Oficial Talkê</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-medium border border-emerald-400/30">
              Pronto para Sala Virtual & Compartilhamento
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Materiais & Módulos Didáticos
          </h2>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Conteúdo pedagógico estruturado fornecido pela Talkê para guiar suas aulas. Cada unidade inclui objetivos claros, gramática aplicada, vocabulário corporativo/conversacional, perguntas de conversação prontas, roteiro de roleplay e slides interativos para apresentação.
          </p>
        </div>

        <div className="shrink-0 relative z-10 flex gap-2">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">Módulos</span>
            <span className="text-xl font-black text-cyan-300">3 Níveis</span>
            <span className="text-[10px] text-slate-400 block">Básico / Interm / Avanç</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">Total</span>
            <span className="text-xl font-black text-emerald-400">{TALKE_CURRICULUM_MATERIALS.length} Unidades</span>
            <span className="text-[10px] text-slate-400 block">100% Práticas</span>
          </div>
        </div>
      </div>

      {/* Copy notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tier Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTier('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedTier === 'ALL'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Todos os Níveis ({TALKE_CURRICULUM_MATERIALS.length})
          </button>
          <button
            onClick={() => setSelectedTier('BASICO')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedTier === 'BASICO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Básico (A1 / A2)
          </button>
          <button
            onClick={() => setSelectedTier('INTERMEDIARIO')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedTier === 'INTERMEDIARIO'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Intermediário (B1 / B2)
          </button>
          <button
            onClick={() => setSelectedTier('AVANCADO')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedTier === 'AVANCADO'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            Avançado (C1 / C2)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por tópico, gramática ou palavra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.map((material) => {
          const tierBadgeStyle =
            material.tier === 'BASICO'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : material.tier === 'INTERMEDIARIO'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-purple-100 text-purple-800 border-purple-200';

          return (
            <div
              key={material.id}
              className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${tierBadgeStyle}`}>
                    {material.tierLabel} • {material.cefr}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {material.durationMinutes} min
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-neutral-900 text-sm group-hover:text-blue-600 transition-colors">
                  {material.title}
                </h3>

                {/* Objective */}
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {material.objective}
                </p>

                {/* Grammar Focus Pill */}
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Foco Gramatical & Estrutural:
                  </span>
                  <p className="text-[11px] font-semibold text-neutral-800 leading-tight">
                    {material.grammarFocus}
                  </p>
                </div>

                {/* Vocabulary Tags */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Vocabulário Chave ({material.vocabulary.length} grupos):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {material.vocabulary.slice(0, 2).map((voc, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md truncate max-w-full"
                      >
                        {voc.split(':')[0]}
                      </span>
                    ))}
                    {material.vocabulary.length > 2 && (
                      <span className="text-[10px] font-medium text-neutral-400 px-1 py-0.5">
                        +{material.vocabulary.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalMaterial(material);
                    setCurrentSlideIndex(0);
                  }}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Ver Slides & Roteiro da Aula</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(material.discussionQuestions.join('\n• '), `Perguntas da ${material.title}`)}
                    className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Copiar perguntas de conversação para o chat"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Perguntas</span>
                  </button>

                  {onLaunchVirtualClassroomWithMaterial && (
                    <button
                      type="button"
                      onClick={() => onLaunchVirtualClassroomWithMaterial(material)}
                      className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                      title="Abrir este material direto na sala de vídeo"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Na Sala</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / DRAWER: SLIDE VIEWER & COMPLETE TEACHER LESSON PLAN */}
      {activeModalMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {activeModalMaterial.unitNumber}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {activeModalMaterial.title}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Módulo {activeModalMaterial.tierLabel} • {activeModalMaterial.cefr} • {activeModalMaterial.durationMinutes} minutos recomendados
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalMaterial(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
              {/* SLIDE PRESENTATION VIEWER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Presentation className="w-4 h-4 text-blue-600" />
                    Slide Interativo ({currentSlideIndex + 1} de {activeModalMaterial.slides.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentSlideIndex === activeModalMaterial.slides.length - 1}
                      onClick={() => setCurrentSlideIndex((prev) => Math.min(activeModalMaterial.slides.length - 1, prev + 1))}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Slide Card */}
                {activeModalMaterial.slides[currentSlideIndex] && (
                  <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-4 border border-slate-700">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                        Slide {currentSlideIndex + 1}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Talkê Digital Slides
                      </span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-white">
                      {activeModalMaterial.slides[currentSlideIndex].title}
                    </h4>

                    <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                      {activeModalMaterial.slides[currentSlideIndex].bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {activeModalMaterial.slides[currentSlideIndex].example && (
                      <div className="bg-white/10 border border-cyan-400/30 p-3.5 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-cyan-300 block mb-1">
                          Exemplo Prático:
                        </span>
                        <p className="text-xs sm:text-sm italic text-white font-medium">
                          {activeModalMaterial.slides[currentSlideIndex].example}
                        </p>
                      </div>
                    )}

                    {activeModalMaterial.slides[currentSlideIndex].exercisePrompt && (
                      <div className="bg-emerald-500/20 border border-emerald-400/30 p-3 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-0.5">
                          Desafio Rápido para o Aluno:
                        </span>
                        <p className="text-xs text-emerald-100 font-semibold">
                          {activeModalMaterial.slides[currentSlideIndex].exercisePrompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ROTEIRO COMPLETO PARA O PROFESSOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Discussion Questions */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Perguntas Prontas de Conversação
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeModalMaterial.discussionQuestions.join('\n• '), 'Perguntas')}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <ul className="space-y-2 text-xs text-neutral-700">
                    {activeModalMaterial.discussionQuestions.map((q, qIdx) => (
                      <li key={qIdx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-neutral-100">
                        <span className="font-bold text-blue-600">{qIdx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Roleplay & Teacher Tips */}
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Cenário de Roleplay / Simulação Guiada
                    </span>
                    <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                      {activeModalMaterial.roleplayScenario}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      Dica Pedagógica Talkê para o Professor
                    </span>
                    <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                      {activeModalMaterial.teacherTips}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assign to Student Widget */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Atribuir este Módulo a um Aluno
                  </span>
                  <p className="text-[11px] text-blue-800">
                    Atualiza o "onde parou" e a lição atual no prontuário do aluno.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    className="px-3 py-1.5 border border-neutral-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {DEFAULT_STUDENT_PROGRESS.map((st) => (
                      <option key={st.studentId} value={st.studentId}>
                        {st.studentName} ({st.currentTier})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAssignToStudent(activeModalMaterial)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Atribuir Lição
                  </button>
                </div>
              </div>

              {assignSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{assignSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-medium">
                Tarefa sugerida: <strong>{activeModalMaterial.homeworkIdea}</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveModalMaterial(null)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
