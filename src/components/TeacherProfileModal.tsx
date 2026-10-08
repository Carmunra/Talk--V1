import React from 'react';
import { X, Star, CheckCircle, Award, Globe, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import {
  Teacher,
  ProficiencyLevelLabels,
  LearningGoalLabels,
  Review,
} from '../domain/types';

interface TeacherProfileModalProps {
  teacher: Teacher;
  reviews: Review[];
  onClose: () => void;
  onBookClick: (teacher: Teacher) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  teacher,
  reviews,
  onClose,
  onBookClick,
}) => {
  const teacherReviews = reviews.filter((r) => r.teacherId === teacher.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <img
              src={teacher.avatarUrl || '/avatar.svg'}
              alt={teacher.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-900">{teacher.name}</h3>
                {teacher.isVerified && (
                  <span title="Professor Verificado">
                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{teacher.headline}</p>

              <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{teacher.rating.toFixed(2)}</span>
                  <span className="text-neutral-400 font-normal">({teacher.totalReviews} avaliações)</span>
                </div>
                <div className="text-neutral-500 font-normal">
                  {teacher.totalLessonsCompleted} aulas ministradas
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-6">
          {/* Biografia */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Sobre o Professor & Metodologia
            </h4>
            <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line bg-neutral-50 p-4 rounded-xl border border-neutral-100">
              {teacher.bio}
            </p>
          </div>

          {/* Conhecimento & Especialidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Especialidades
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {teacher.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200"
                  >
                    {LearningGoalLabels[spec]}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Níveis Atendidos
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {teacher.levelsTaught.map((lvl) => (
                  <span
                    key={lvl}
                    className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 text-[11px] font-semibold border border-cyan-200"
                  >
                    {ProficiencyLevelLabels[lvl].split(' - ')[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certificações e Idiomas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-2.5">
              <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block">Certificações</span>
                <span className="text-neutral-600 text-[11px]">{teacher.certifications.join(', ')}</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block">Idiomas Falados</span>
                <span className="text-neutral-600 text-[11px]">{teacher.languages.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Avaliações Recentes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                Avaliações de Alunos ({teacherReviews.length})
              </h4>
            </div>

            {teacherReviews.length === 0 ? (
              <div className="text-xs text-neutral-400 italic p-4 text-center bg-neutral-50 rounded-xl">
                Nenhuma avaliação pública ainda. Seja o primeiro a avaliar este professor!
              </div>
            ) : (
              <div className="space-y-3">
                {teacherReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rev.studentAvatar && (
                          <img
                            src={rev.studentAvatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        )}
                        <span className="font-bold text-neutral-900">{rev.studentName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-neutral-700 italic">"{rev.comment}"</p>
                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rev.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="bg-white text-neutral-600 px-2 py-0.5 rounded text-[10px] border border-neutral-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Price and Book Button */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-500 block">Investimento</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-neutral-500">R$</span>
              <span className="text-2xl font-black text-neutral-900">
                {teacher.hourlyPriceBrl.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs text-neutral-400">/ 50 min</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onClose();
                onBookClick(teacher);
              }}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Escolher Horário & Agendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
