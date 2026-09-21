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
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { Teacher, Lesson, Review, LessonStatus, AvailabilitySlot, TalkeModuleTier } from '../domain/types';
import { TeacherStudentProgressView } from './TeacherStudentProgressView';
import { TeacherMaterialsView } from './TeacherMaterialsView';

interface TeacherDashboardViewProps {
  currentTeacher: Teacher;
  onEnterClassroom: (lesson: Lesson) => void;
  onRefreshTeacher: () => void;
  initialTab?: 'reservations' | 'students_progress' | 'materials' | 'availability' | 'earnings' | 'reviews';
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  currentTeacher,
  onEnterClassroom,
  onRefreshTeacher,
  initialTab = 'reservations',
}) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'students_progress' | 'materials' | 'availability' | 'earnings' | 'reviews'>(initialTab);
  const [selectedMaterialNav, setSelectedMaterialNav] = useState<{ tier: TalkeModuleTier; unit: number } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
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

  // Ensure all 126 slots (7 days x 18 hours: 06:00 to 23:00) exist
  const getFullWeeklySlots = (existingSlots: AvailabilitySlot[]): AvailabilitySlot[] => {
    const days = [
      { day: 0, label: 'Domingo' },
      { day: 1, label: 'Segunda' },
      { day: 2, label: 'Terça' },
      { day: 3, label: 'Quarta' },
      { day: 4, label: 'Quinta' },
      { day: 5, label: 'Sexta' },
      { day: 6, label: 'Sábado' },
    ];
    const hours = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];
    const existingMap = new Map<string, boolean>();
    existingSlots.forEach((s) => {
      existingMap.set(`${s.dayOfWeek}-${s.startTime}`, s.isAvailable);
    });

    const fullSlots: AvailabilitySlot[] = [];
    days.forEach((d) => {
      hours.forEach((h) => {
        const startH = Number(h.split(':')[0]);
        const endH = String(startH + 1).padStart(2, '0') + ':00';
        const key = `${d.day}-${h}`;
        const hasExisting = existingMap.has(key);
        const isDefault = hasExisting
          ? existingMap.get(key)!
          : (d.day >= 1 && d.day <= 5 && startH >= 9 && startH <= 18);

        fullSlots.push({
          id: `slot-${d.day}-${h.replace(':', '')}`,
          dayOfWeek: d.day,
          dayLabel: d.label,
          startTime: h,
          endTime: endH,
          isAvailable: Boolean(isDefault),
        });
      });
    });
    return fullSlots;
  };

  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  useEffect(() => {
    loadData();
    setAvailabilitySlots(getFullWeeklySlots(currentTeacher.availability || []));
  }, [currentTeacher.id]);

  const toggleSlotAvailability = (slotId: string) => {
    setAvailabilitySlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  // Batch toggle by day
  const toggleAllSlotsInDay = (dayNum: number) => {
    setAvailabilitySlots((prev) => {
      const daySlots = prev.filter((s) => s.dayOfWeek === dayNum);
      const allActive = daySlots.every((s) => s.isAvailable);
      return prev.map((s) =>
        s.dayOfWeek === dayNum ? { ...s, isAvailable: !allActive } : s
      );
    });
  };

  // Presets
  const applyPreset = (type: 'all' | 'business' | 'evenings_weekends' | 'clear') => {
    setAvailabilitySlots((prev) =>
      prev.map((slot) => {
        const hourNum = Number(slot.startTime.split(':')[0]);
        const isWeekday = slot.dayOfWeek >= 1 && slot.dayOfWeek <= 5;
        const isWeekend = slot.dayOfWeek === 0 || slot.dayOfWeek === 6;

        if (type === 'all') return { ...slot, isAvailable: true };
        if (type === 'clear') return { ...slot, isAvailable: false };
        if (type === 'business') {
          return { ...slot, isAvailable: isWeekday && hourNum >= 8 && hourNum <= 18 };
        }
        if (type === 'evenings_weekends') {
          return {
            ...slot,
            isAvailable: (isWeekday && hourNum >= 18 && hourNum <= 22) || (isWeekend && hourNum >= 9 && hourNum <= 17),
          };
        }
        return slot;
      })
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
          onClick={() => setActiveTab('students_progress')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'students_progress'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Evolução dos Alunos (Onde Pararam)</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-700 px-1.5 py-0.5 rounded font-extrabold uppercase">
            Novo
          </span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Materiais & Módulos Talkê</span>
          <span className="text-[9px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
            3 Níveis
          </span>
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

      {/* TAB 2: EVOLUÇÃO DOS ALUNOS & ONDE PARARAM */}
      {activeTab === 'students_progress' && (
        <TeacherStudentProgressView
          currentTeacher={currentTeacher}
          onOpenMaterial={(tier, unit) => {
            setSelectedMaterialNav({ tier, unit });
            setActiveTab('materials');
          }}
          onOpenClassroomWithStudent={(studentName) => {
            const matchLesson = teacherLessons.find((l) => l.studentName.toLowerCase().includes(studentName.toLowerCase()));
            if (matchLesson) {
              onEnterClassroom(matchLesson);
            } else if (teacherLessons[0]) {
              onEnterClassroom(teacherLessons[0]);
            }
          }}
        />
      )}

      {/* TAB 3: MATERIAIS & MÓDULOS DIDÁTICOS TALKÊ */}
      {activeTab === 'materials' && (
        <TeacherMaterialsView
          initialTier={selectedMaterialNav?.tier}
          initialUnitNumber={selectedMaterialNav?.unit}
          onLaunchVirtualClassroomWithMaterial={(material) => {
            if (teacherLessons.length > 0) {
              onEnterClassroom({
                ...teacherLessons[0],
                topic: material.title,
              });
            } else {
              // Synthetic lesson so teacher can test presenting material
              onEnterClassroom({
                id: 'demo-material-lesson',
                studentId: 'stu-1',
                studentName: 'Lucas Silva',
                teacherId: currentTeacher.id,
                teacherName: currentTeacher.name,
                scheduledDate: new Date().toISOString().split('T')[0],
                startTime: 'Agora',
                durationMinutes: 50,
                status: LessonStatus.InProgress,
                priceBrl: currentTeacher.hourlyPriceBrl,
                platformFeeBrl: currentTeacher.hourlyPriceBrl * 0.15,
                teacherNetBrl: currentTeacher.hourlyPriceBrl * 0.85,
                topic: material.title,
                isPaid: true,
                createdAt: new Date().toISOString(),
              });
            }
          }}
        />
      )}

      {/* TAB 4: DEFINIR DISPONIBILIDADE (TODOS OS HORÁRIOS 06h às 23h - 7 DIAS) */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
          {/* Header & Save Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">Agenda & Grade Completa de Disponibilidade</h3>
                <span className="text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                  126 Horários Possíveis / Semana
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Defina exatamente quando aceita aulas particulares (06:00 às 23:00, Domingo a Sábado). Os alunos verão sua grade em tempo real.
              </p>
            </div>

            <button
              onClick={handleSaveAvailability}
              disabled={isSavingSlots}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSlots ? 'Salvando Grade...' : 'Salvar Disponibilidade'}</span>
            </button>
          </div>

          {/* Quick Metrics & Earning Potential */}
          {(() => {
            const activeCount = availabilitySlots.filter((s) => s.isAvailable).length;
            const grossPotential = activeCount * currentTeacher.hourlyPriceBrl;
            const netPotential = grossPotential * 0.85;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs">
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium">Horários Ativos:</span>
                  <div className="text-base font-black text-blue-700 mt-0.5">
                    {activeCount} <span className="text-xs font-normal text-neutral-400">/ 126 slots</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium">Carga Semanal Aberta:</span>
                  <div className="text-base font-black text-neutral-800 mt-0.5">
                    {activeCount * 50} <span className="text-xs font-normal text-neutral-400">minutos</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium">Potencial Bruto:</span>
                  <div className="text-base font-black text-neutral-900 mt-0.5">
                    R$ {grossPotential.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium">Potencial Líquido (85%):</span>
                  <div className="text-base font-black text-emerald-600 mt-0.5">
                    R$ {netPotential.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Preset Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700">Preenchimento Rápido & Ações em Massa:</span>
              <span className="text-[11px] text-neutral-400">Clique para aplicar padrões instantâneos</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
              >
                ✨ Marcar Todos os 126 Horários (Disponibilidade Total)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('business')}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 transition-colors"
              >
                🏢 Horário Comercial (Seg-Sex, 08h às 18h)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('evenings_weekends')}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
              >
                🌙 Noites (18h-22h) & Fins de Semana
              </button>
              <button
                type="button"
                onClick={() => applyPreset('clear')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors ml-auto"
              >
                🗑️ Desmarcar Todos
              </button>
            </div>
          </div>

          {/* Period Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-2">
            <span className="text-xs font-medium text-neutral-500 mr-2">Filtrar período:</span>
            {[
              { id: 'all', label: 'Todos os Horários (06:00 - 23:00)' },
              { id: 'morning', label: '🌅 Manhã (06:00 - 11:00)' },
              { id: 'afternoon', label: '☀️ Tarde (12:00 - 17:00)' },
              { id: 'evening', label: '🌙 Noite (18:00 - 23:00)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  periodFilter === tab.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 7-Day Interactive Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
              const daySlotsAll = availabilitySlots.filter((s) => s.dayOfWeek === dayNum);
              const dayName = daySlotsAll[0]?.dayLabel || (dayNum === 0 ? 'Domingo' : `Dia ${dayNum}`);
              const activeCountInDay = daySlotsAll.filter((s) => s.isAvailable).length;

              // Filter by period if selected
              const visibleSlots = daySlotsAll.filter((slot) => {
                const hourNum = Number(slot.startTime.split(':')[0]);
                if (periodFilter === 'morning') return hourNum >= 6 && hourNum <= 11;
                if (periodFilter === 'afternoon') return hourNum >= 12 && hourNum <= 17;
                if (periodFilter === 'evening') return hourNum >= 18 && hourNum <= 23;
                return true;
              });

              return (
                <div key={dayNum} className="p-3 bg-neutral-50/80 rounded-2xl border border-neutral-200/80 space-y-2 flex flex-col justify-between">
                  <div>
                    {/* Clickable Day Header to toggle all slots in this day */}
                    <button
                      type="button"
                      onClick={() => toggleAllSlotsInDay(dayNum)}
                      title="Clique para alternar todos os horários deste dia"
                      className="w-full text-center pb-2 border-b border-neutral-200 hover:bg-white rounded-lg p-1 transition-colors group"
                    >
                      <span className="text-xs font-bold text-neutral-900 block group-hover:text-blue-600">
                        {dayName}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {activeCountInDay} de {daySlotsAll.length} ativos
                      </span>
                    </button>

                    {/* Slots Column */}
                    <div className="space-y-1 mt-2 max-h-[420px] overflow-y-auto pr-1">
                      {visibleSlots.map((slot) => {
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => toggleSlotAvailability(slot.id)}
                            className={`w-full py-1 px-1.5 rounded-lg text-xs font-semibold text-center transition-all flex items-center justify-between ${
                              slot.isAvailable
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs scale-[1.01]'
                                : 'bg-white text-neutral-400 border border-neutral-200 hover:border-blue-300 hover:text-neutral-700'
                            }`}
                          >
                            <span className="font-mono text-[11px]">{slot.startTime}</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-80">
                              {slot.isAvailable ? 'Livre' : 'Off'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/60 text-center">
                    <button
                      type="button"
                      onClick={() => toggleAllSlotsInDay(dayNum)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline"
                    >
                      {activeCountInDay === daySlotsAll.length ? 'Desmarcar dia' : 'Marcar dia'}
                    </button>
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
