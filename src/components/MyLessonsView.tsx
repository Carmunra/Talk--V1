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
  Zap,
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
          <span className="text-xs font-bold tracking-wider text-blue-600 uppercase block mb-1">
            Talkê • Minha Agenda
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Minhas Aulas Agendadas</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Acompanhe seus horários, entre na sala virtual ao vivo ou avalie o professor após o término.
          </p>
        </div>

        <button
          onClick={onGoToTeachers}
          className="ed-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Agendar Nova Aula</span>
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Nenhuma aula agendada ainda</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Pesquise professores com base no seu objetivo e agende sua primeira aula particular de 50 minutos.
            </p>
          </div>
          <button
            onClick={onGoToTeachers}
            className="ed-btn-primary px-6 py-2.5 text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-2"
          >
            <span>Explorar Professores</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {lessons.map((lesson) => {
            const isCompleted = lesson.status === LessonStatus.Completed;
            const isConfirmed = lesson.status === LessonStatus.Confirmed;
            const needsPayment = !lesson.isPaid;

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all text-slate-800"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
                        {lesson.scheduledDate} às {lesson.startTime} (50 min)
                      </span>
                      <h3 className="font-extrabold text-lg text-slate-900 mt-2">
                        {lesson.teacherName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-xs">
                      {needsPayment ? (
                        <span className="font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Aguardando Pagamento
                        </span>
                      ) : isCompleted ? (
                        <span className="font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          Concluída
                        </span>
                      ) : (
                        <span className="font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Confirmada
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-3 font-medium">
                    <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Tópico:</span>
                    {lesson.topic}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Investimento da Sessão:</span>
                    <span className="font-black text-slate-900 text-base">
                      R$ {lesson.priceBrl.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  {needsPayment ? (
                    <button
                      onClick={() => onPayLesson(lesson)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Efetuar Pagamento (PIX / Cartão)</span>
                    </button>
                  ) : !isCompleted ? (
                    <button
                      onClick={() => onEnterClassroom(lesson)}
                      className="w-full py-2.5 px-4 ed-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Entrar na Sala Virtual & Fazer Aula</span>
                    </button>
                  ) : !lesson.hasBeenReviewed ? (
                    <button
                      onClick={() => onReviewLesson(lesson)}
                      className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>Avaliar Aula & Professor</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
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
