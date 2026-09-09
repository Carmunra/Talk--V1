import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  CreditCard,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Lesson, LessonStatus } from '../domain/types';

interface MyLessonsViewProps {
  lessons: Lesson[];
  onEnterClassroom: (lesson: Lesson) => void;
  onPayLesson: (lesson: Lesson) => void;
  onReviewLesson: (lesson: Lesson) => void;
  onGoToTeachers: () => void;
}

export const MyLessonsView: React.FC<MyLessonsViewProps> = ({
  lessons,
  onEnterClassroom,
  onPayLesson,
  onReviewLesson,
  onGoToTeachers,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900">Minhas Aulas Agendadas</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Acompanhe seus horários, entre na sala virtual ou avalie professores pós-aula.
          </p>
        </div>

        <button
          onClick={onGoToTeachers}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          <span>Agendar Nova Aula</span>
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900">Nenhuma aula agendada ainda</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Pesquise professores com base no seu objetivo e agende sua primeira aula de 50 minutos.
            </p>
          </div>
          <button
            onClick={onGoToTeachers}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Explorar Professores
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => {
            const isCompleted = lesson.status === LessonStatus.Completed;
            const isConfirmed = lesson.status === LessonStatus.Confirmed;
            const needsPayment = !lesson.isPaid;

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {lesson.scheduledDate} às {lesson.startTime} (50 min)
                      </span>
                      <h3 className="font-bold text-base text-neutral-900 mt-1">
                        {lesson.teacherName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {needsPayment ? (
                        <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          Aguardando Pagamento
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                          Concluída
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Confirmada
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 mt-2.5">
                    <span className="font-semibold text-neutral-800">Tópico:</span> {lesson.topic}
                  </p>

                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Valor Investido:</span>
                    <span className="font-extrabold text-neutral-900">
                      R$ {lesson.priceBrl.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  {needsPayment ? (
                    <button
                      onClick={() => onPayLesson(lesson)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Efetuar Pagamento (PIX / Cartão)</span>
                    </button>
                  ) : !isCompleted ? (
                    <button
                      onClick={() => onEnterClassroom(lesson)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Entrar na Sala Virtual & Fazer Aula</span>
                    </button>
                  ) : !lesson.hasBeenReviewed ? (
                    <button
                      onClick={() => onReviewLesson(lesson)}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>Avaliar Aula & Professor</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs font-bold text-amber-600 bg-amber-50 rounded-xl flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Aula Avaliada com Sucesso ⭐</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
