import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Star,
  Clock,
  Video,
  CheckCircle,
  Save,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Teacher, Lesson, Review, LessonStatus, AvailabilitySlot } from '../domain/types';

interface TeacherDashboardViewProps {
  currentTeacher: Teacher;
  onEnterClassroom: (lesson: Lesson) => void;
  onRefreshTeacher: () => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  currentTeacher,
  onEnterClassroom,
  onRefreshTeacher,
}) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'availability' | 'earnings' | 'reviews'>('reservations');
  const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
  const [earningsData, setEarningsData] = useState<{
    totalGross: number;
    totalPlatformCommission: number;
    totalNetEarnings: number;
    availableForWithdrawalBrl: number;
    escrowPendingBrl: number;
  } | null>(null);
  const [teacherReviews, setTeacherReviews] = useState<Review[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>(
    currentTeacher.availability || []
  );
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [pixKeyInput, setPixKeyInput] = useState<string>('chave.pix.docente@talke.com');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load teacher details
  const loadData = async () => {
    try {
      const [lessonsRes, earningsRes, reviewsRes] = await Promise.all([
        fetch(`/api/lessons?teacherId=${currentTeacher.id}`),
        fetch(`/api/teachers/${currentTeacher.id}/earnings`),
        fetch(`/api/teachers/${currentTeacher.id}`),
      ]);

      const lessonsJson = await lessonsRes.json();
      const earningsJson = await earningsRes.json();
      const teacherDetailJson = await reviewsRes.json();

      setTeacherLessons(lessonsJson);
      setEarningsData(earningsJson);
      if (teacherDetailJson.reviews) {
        setTeacherReviews(teacherDetailJson.reviews);
      }
    } catch (err) {
      console.error('Erro ao carregar painel do professor:', err);
    }
  };

  useEffect(() => {
    loadData();
    setAvailabilitySlots(currentTeacher.availability || []);
  }, [currentTeacher.id]);

  const toggleSlotAvailability = (slotId: string) => {
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  const handleSaveAvailability = async () => {
    setIsSavingSlots(true);
    try {
      const res = await fetch(`/api/teachers/${currentTeacher.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: availabilitySlots }),
      });

      if (res.ok) {
        alert('Grade de disponibilidade atualizada com sucesso!');
        onRefreshTeacher();
      }
    } catch (err: any) {
      alert('Erro ao salvar disponibilidade: ' + err.message);
    } finally {
      setIsSavingSlots(false);
    }
  };

  const handleRequestWithdraw = () => {
    if (!earningsData || earningsData.availableForWithdrawalBrl <= 0) {
      alert('Nenhum saldo liberado para saque no momento.');
      return;
    }

    setIsWithdrawing(true);
    setTimeout(() => {
      setWithdrawSuccess(
        `Saque de R$ ${earningsData.availableForWithdrawalBrl.toFixed(2)} enviado via PIX para ${pixKeyInput} com sucesso!`
      );
      setIsWithdrawing(false);
      setTimeout(() => setWithdrawSuccess(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Profile Summary Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentTeacher.avatarUrl}
            alt={currentTeacher.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">{currentTeacher.name}</h2>
              {currentTeacher.isVerified && (
                <CheckCircle className="w-5 h-5 text-cyan-200 shrink-0" />
              )}
            </div>
            <p className="text-xs text-blue-100 max-w-xl mt-1">{currentTeacher.headline}</p>

            <div className="flex items-center gap-3 mt-3 text-xs font-semibold">
              <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{currentTeacher.rating.toFixed(2)}</span>
                <span className="text-blue-100 font-normal">({currentTeacher.totalReviews} avaliações)</span>
              </div>
              <div className="bg-white/20 px-2.5 py-1 rounded-lg">
                R$ {currentTeacher.hourlyPriceBrl.toFixed(2)} / 50 min
              </div>
              <div className="bg-white/20 px-2.5 py-1 rounded-lg">
                {currentTeacher.totalLessonsCompleted} aulas concluídas
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[180px]">
          <span className="text-[11px] uppercase tracking-wider text-blue-100 font-bold block">
            Saldo Disponível (Líquido)
          </span>
          <span className="text-2xl font-black mt-1 block">
            R$ {earningsData?.availableForWithdrawalBrl.toFixed(2).replace('.', ',') || '0,00'}
          </span>
          <span className="text-[10px] text-blue-100 block mt-0.5">Livre da taxa Talkê de 15%</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reservations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Minhas Reservas ({teacherLessons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'availability'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Definir Disponibilidade Semanal</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'earnings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Ganhos & Repasse (Comissão Talkê)</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Avaliações Recebidas ({teacherReviews.length})</span>
        </button>
      </div>

      {/* TAB 1: RECEBER RESERVA & REALIZAR AULA */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {teacherLessons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-xs text-neutral-500">
              Nenhuma reserva recebida até o momento. Seus horários ativos aparecerão para os alunos!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherLessons.map((lesson) => {
                const isConfirmed = lesson.status === LessonStatus.Confirmed;
                const isCompleted = lesson.status === LessonStatus.Completed;

                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {lesson.scheduledDate} às {lesson.startTime}
                          </span>
                          <h4 className="font-bold text-base text-neutral-900 mt-1">
                            Aluno: {lesson.studentName}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-neutral-100 text-neutral-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isCompleted ? 'Concluída' : 'Confirmada'}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-600 mt-2">
                        <span className="font-semibold text-neutral-800">Tópico:</span> {lesson.topic}
                      </p>

                      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Seu Repasse Líquido:</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          R$ {lesson.teacherNetBrl.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEnterClassroom(lesson)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>{isCompleted ? 'Ver Sala & Anotações' : 'Entrar na Sala Virtual & Realizar Aula'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEFINIR DISPONIBILIDADE */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Grade de Horários Semanais</h3>
              <p className="text-xs text-neutral-500">
                Clique nos blocos para ativar ou desativar horários em que você aceita reservas de 50 minutos.
              </p>
            </div>
            <button
              onClick={handleSaveAvailability}
              disabled={isSavingSlots}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSlots ? 'Salvando...' : 'Salvar Disponibilidade'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((dayNum) => {
              const daySlots = availabilitySlots.filter((s) => s.dayOfWeek === dayNum);
              const dayName = daySlots[0]?.dayLabel || `Dia ${dayNum}`;

              return (
                <div key={dayNum} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-800 text-center pb-1 border-b border-neutral-200">
                    {dayName}
                  </h4>
                  <div className="space-y-1.5">
                    {daySlots.map((slot) => {
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlotAvailability(slot.id)}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                            slot.isAvailable
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-neutral-400 border border-dashed border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RECEBER PAGAMENTO & COMISSÃO TALKÊ */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Alerta de Saque */}
          {withdrawSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{withdrawSuccess}</span>
            </div>
          )}

          {/* Cards de Métricas Financeiras */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Total Bruto de Aulas</span>
              <h3 className="text-2xl font-black text-neutral-900 mt-1">
                R$ {earningsData?.totalGross.toFixed(2).replace('.', ',')}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1">Volume total faturado</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
              <span className="text-xs text-neutral-500 font-medium">Taxa de Serviço Talkê (15%)</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                - R$ {earningsData?.totalPlatformCommission.toFixed(2).replace('.', ',')}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1">Comissão retida da plataforma</p>
            </div>

            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-700 font-bold">Disponível para Saque via PIX</span>
              <h3 className="text-2xl font-black text-emerald-900 mt-1">
                R$ {earningsData?.availableForWithdrawalBrl.toFixed(2).replace('.', ',')}
              </h3>
              <p className="text-[11px] text-emerald-700 mt-1">Aulas realizadas e concluídas</p>
            </div>
          </div>

          {/* Seção de Saque PIX */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
            <h4 className="text-sm font-bold text-neutral-900 mb-2">Solicitar Saque para sua Chave PIX</h4>
            <p className="text-xs text-neutral-500 mb-4">
              Os repasses de aulas concluídas são liberados instantaneamente para a sua chave bancária cadastrada.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={pixKeyInput}
                onChange={(e) => setPixKeyInput(e.target.value)}
                placeholder="Insira sua chave PIX (CPF, e-mail ou chave aleatória)"
                className="w-full sm:flex-1 p-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRequestWithdraw}
                disabled={isWithdrawing || !earningsData || earningsData.availableForWithdrawalBrl <= 0}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isWithdrawing ? 'Processando Transferência...' : 'Sacar Saldo Disponível'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECEBER AVALIAÇÃO */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Feedback & Avaliações dos Alunos</h3>
              <p className="text-xs text-neutral-500">Média geral: {currentTeacher.rating.toFixed(2)} estrelas</p>
            </div>
            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-3 py-1 rounded-xl font-bold text-xs">
              <Star className="w-4 h-4 fill-current" />
              <span>{currentTeacher.rating.toFixed(2)} / 5.0</span>
            </div>
          </div>

          {teacherReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 italic">
              Nenhuma avaliação recebida ainda. Após cada aula concluída, os alunos recebem o formulário de avaliação.
            </div>
          ) : (
            <div className="space-y-3">
              {teacherReviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {rev.studentAvatar && (
                        <img src={rev.studentAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      )}
                      <span className="font-bold text-neutral-900">{rev.studentName}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-neutral-700 italic leading-relaxed">"{rev.comment}"</p>
                  {rev.tags && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rev.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-white text-neutral-600 px-2 py-0.5 rounded text-[10px] border border-neutral-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
