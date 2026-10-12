import React, { useState, useRef } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { Teacher, Student } from '../domain/types';
import { bookingDates } from '../lib/bookingDates';
import { useDialog } from '../lib/useDialog';

interface BookingModalProps {
  teacher: Teacher;
  currentStudent: Student;
  onClose: () => void;
  usePlan?: boolean;
  onConfirmBooking: (bookingData: {
    teacherId: string;
    scheduledDate: string;
    startTime: string;
    topic: string;
    requestKey: string;
  }) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  teacher,
  currentStudent,
  onClose,
  onConfirmBooking,
  usePlan = false,
}) => {
  const availableDates = bookingDates();

  const [selectedDate, setSelectedDate] = useState(availableDates[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const reservationKeys = useRef(new Map<string, string>());
  const [topic, setTopic] = useState<string>(
    currentStudent.goalDescription
      ? `Foco: ${currentStudent.goalDescription}`
      : 'Conversação prática e alinhamento de pronúncia',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialog = useDialog(onClose, !isSubmitting);
  const [error, setError] = useState<string | null>(null);

  // Filter slots for the selected day of week
  const selectedDayOfWeek = availableDates.find((d) => d.dateStr === selectedDate)?.dayOfWeek ?? 1;
  const daySlots = teacher.availability.filter(
    (s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable,
  );

  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  const timeOptions = [
    ...new Set(
      daySlots.flatMap((slot) => {
        const result: string[] = [];
        for (
          let minute = toMinutes(slot.startTime);
          minute + 50 <= toMinutes(slot.endTime);
          minute += 60
        )
          result.push(
            String(Math.floor(minute / 60)).padStart(2, '0') +
              ':' +
              String(minute % 60).padStart(2, '0'),
          );
        return result;
      }),
    ),
  ].sort();

  const [bookingPeriodFilter, setBookingPeriodFilter] = useState<
    'all' | 'morning' | 'afternoon' | 'evening'
  >('all');

  const filteredTimeOptions = timeOptions.filter((time) => {
    const h = Number(time.split(':')[0]);
    if (bookingPeriodFilter === 'morning') return h >= 6 && h <= 11;
    if (bookingPeriodFilter === 'afternoon') return h >= 12 && h <= 17;
    if (bookingPeriodFilter === 'evening') return h >= 18 && h <= 23;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !timeOptions.includes(selectedTime)) {
      setError('Selecione uma data e um horário.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = JSON.stringify({
        teacherId: teacher.id,
        scheduledDate: selectedDate,
        startTime: selectedTime,
        topic,
      });
      if (!reservationKeys.current.has(payload))
        reservationKeys.current.set(payload, crypto.randomUUID());
      await onConfirmBooking({
        teacherId: teacher.id,
        scheduledDate: selectedDate,
        startTime: selectedTime,
        topic,
        requestKey: reservationKeys.current.get(payload)!,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao agendar aula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 id="booking-title" className="text-base font-bold text-neutral-900">
              Escolher Horário & Reservar
            </h3>
            <p className="text-xs text-neutral-500">Aula particular de 50 min com {teacher.name}</p>
          </div>
          <button
            type="button"
            aria-label="Fechar reserva"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* 1. Escolher Data */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              1. Selecione o Dia
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all capitalize text-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Escolher Horário */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                2. Horários Disponíveis do Professor ({timeOptions.length} no dia)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'morning', label: 'Manhã' },
                  { id: 'afternoon', label: 'Tarde' },
                  { id: 'evening', label: 'Noite' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBookingPeriodFilter(p.id as any)}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      bookingPeriodFilter === p.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTimeOptions.length === 0 ? (
              <p className="text-xs text-neutral-500 py-3 text-center bg-neutral-50 rounded-xl">
                Nenhum horário disponível para o período selecionado. Escolha outro período acima.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredTimeOptions.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected
                          ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Tópico da Aula */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              3. O que você gostaria de praticar nessa aula?
            </label>
            <textarea
              aria-label="Tema da aula"
              maxLength={500}
              rows={2}
              placeholder="Ex: Treino de conversação para viagem, tirar dúvidas de gramática ou entrevista de emprego..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Resumo de Preço */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
            <span className="text-neutral-500">
              {usePlan ? 'Aula do plano (50 min):' : 'Valor da Aula (50 min):'}
            </span>
            <span className="font-extrabold text-neutral-900 text-sm">
              {usePlan
                ? '1 aula do seu saldo'
                : `R$ ${teacher.hourlyPriceBrl.toFixed(2).replace('.', ',')}`}
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:opacity-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>
                {isSubmitting
                  ? 'Reservando...'
                  : usePlan
                    ? 'Reservar com meu plano'
                    : 'Confirmar Reserva & Pagar'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
