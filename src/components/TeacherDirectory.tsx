import React, { useState } from 'react';
import {
  Search,
  Filter,
  Star,
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Target,
  Clock,
  User,
} from 'lucide-react';
import {
  Teacher,
  Student,
  ProficiencyLevel,
  ProficiencyLevelLabels,
  LearningGoal,
  LearningGoalLabels,
} from '../domain/types';
import { MatchingService } from '../domain/services/matchingService';

interface TeacherDirectoryProps {
  teachers: Teacher[];
  currentStudent: Student | null;
  onSelectTeacher: (teacher: Teacher) => void;
  onBookTeacher: (teacher: Teacher) => void;
  onGoToDiagnostic: () => void;
}

export const TeacherDirectory: React.FC<TeacherDirectoryProps> = ({
  teachers,
  currentStudent,
  onSelectTeacher,
  onBookTeacher,
  onGoToDiagnostic,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(200);

  // Compute matching for each teacher if student is logged in
  const rankedTeachers = currentStudent
    ? MatchingService.rankTeachers(currentStudent, teachers)
    : teachers.map((t) => ({
        teacher: t,
        matchScore: 0,
        matchReasons: [],
        isGoalMatch: false,
        isLevelMatch: false,
        isAvailabilityMatch: true,
      }));

  // Apply filters
  const filtered = rankedTeachers.filter(({ teacher }) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText =
        teacher.name.toLowerCase().includes(q) ||
        teacher.headline.toLowerCase().includes(q) ||
        teacher.bio.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    // Goal Filter
    if (selectedGoal !== 'ALL') {
      if (!teacher.specialties.includes(selectedGoal as LearningGoal)) return false;
    }

    // Level Filter
    if (selectedLevel !== 'ALL') {
      const lvlNum = Number(selectedLevel);
      if (!teacher.levelsTaught.includes(lvlNum)) return false;
    }

    // Max Price
    if (teacher.hourlyPriceBrl > maxPrice) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Diagnostic Callout if student hasn't completed it */}
      {currentStudent && !currentStudent.hasCompletedDiagnostic && (
        <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base">Descubra seu Nível e Objetivos com a Talkê!</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Responda nosso diagnóstico rápido de 3 minutos para receber o match ideal de professores.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToDiagnostic}
            className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Fazer Diagnóstico Gratuito</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-neutral-900">Encontre seu Professor de Inglês Ideal</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Professores qualificados, com metodologia comunicativa e foco nos seus objetivos.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Objetivo */}
          <div>
            <label className="block text-neutral-600 font-semibold mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              Objetivo / Especialidade
            </label>
            <select
              aria-label="Filtrar por objetivo"
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Todos os Objetivos</option>
              {Object.entries(LearningGoalLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Nível CEFR */}
          <div>
            <label className="block text-neutral-600 font-semibold mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              Nível Atendido (CEFR)
            </label>
            <select
              aria-label="Filtrar por nível"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Todos os Níveis (A1 ao C2)</option>
              {Object.entries(ProficiencyLevelLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Preço Máximo */}
          <div>
            <div className="flex justify-between items-center mb-1 font-semibold text-neutral-600">
              <span>Preço Máximo</span>
              <span className="text-blue-600 font-bold">Até R$ {maxPrice} / aula</span>
            </div>
            <input
              type="range"
              aria-label="Preço máximo por aula"
              min="50"
              max="200"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(({ teacher, matchScore, matchReasons }) => (
          <div
            key={teacher.id}
            className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div>
              {/* Top Row: Avatar & Match Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={teacher.avatarUrl || '/avatar.svg'}
                    alt={teacher.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/20 group-hover:border-blue-500 transition-colors shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-neutral-900 text-sm">{teacher.name}</h3>
                      {teacher.isVerified && (
                        <span title="Professor Verificado">
                          <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{teacher.rating.toFixed(2)}</span>
                      <span className="text-neutral-400 font-normal">({teacher.totalReviews})</span>
                    </div>
                  </div>
                </div>

                {/* Match Score Badge */}
                {currentStudent && (
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700 text-[11px] font-black shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {matchScore}% Match
                    </span>
                  </div>
                )}
              </div>

              {/* Headline */}
              <p className="text-xs text-neutral-600 mt-3 font-medium line-clamp-2 leading-relaxed">
                {teacher.headline}
              </p>

              {/* Reason Snippet */}
              {matchReasons.length > 0 && (
                <div className="mt-2 text-[10px] text-cyan-700 bg-cyan-50/60 p-2 rounded-lg border border-cyan-100 flex items-center gap-1">
                  <span className="font-bold">Destaque:</span>
                  <span className="truncate">{matchReasons[0]}</span>
                </div>
              )}

              {/* Specialties Chips */}
              <div className="mt-3 flex flex-wrap gap-1">
                {teacher.specialties.slice(0, 2).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700"
                  >
                    {LearningGoalLabels[s].split(' ')[0]}
                  </span>
                ))}
                {teacher.levelsTaught.slice(0, 2).map((l) => (
                  <span
                    key={l}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800"
                  >
                    {ProficiencyLevelLabels[l].split(' - ')[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom: Price and Buttons */}
            <div className="mt-5 pt-4 border-t border-neutral-100">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[11px] text-neutral-400">Aula particular:</span>
                <div>
                  <span className="text-xs font-semibold text-neutral-500">R$ </span>
                  <span className="text-lg font-black text-neutral-900">
                    {teacher.hourlyPriceBrl.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[11px] text-neutral-400"> / 50 min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectTeacher(teacher)}
                  className="py-2 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors text-center"
                >
                  Ver Perfil
                </button>
                <button
                  onClick={() => onBookTeacher(teacher)}
                  className="py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
