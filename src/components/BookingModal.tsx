import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { Teacher, Student } from '../domain/types';

interface BookingModalProps {
  teacher: Teacher;
  currentStudent: Student;
  onClose: () => void;
  onConfirmBooking: (bookingData: {
    teacherId: string;
    scheduledDate: string;
    startTime: string;
    topic: string;
  }) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  teacher,
  currentStudent,
  onClose,
  onConfirmBooking,
}) => {
  // Dates: today + 1 to today + 7
  const availableDates: { dateStr: string; label: string; dayOfWeek: number }[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    availableDates.push({
      dateStr,
      label: `${dayName}, ${dayMonth}`,
      dayOfWeek,
    });
  }

  const [selectedDate, setSelectedDate] = useState(availableDates[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>('14:00');
  const [topic, setTopic] = useState<string>(
    currentStudent.goalDescription
      ? `Foco: ${currentStudent.goalDescription}`
      : 'Conversação prática e alinhamento de pronúncia'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter slots for the selected day of week
  const selectedDayOfWeek = availableDates.find((d) => d.dateStr === selectedDate)?.dayOfWeek ?? 1;
  const daySlots = teacher.availability.filter(
    (s) => s.dayOfWeek === selectedDayOfWeek && s.isAvailable
  );

  // Fallback default hours if none configured
  const timeOptions = daySlots.length > 0
    ? daySlots.map((s) => s.startTime)
    : ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Selecione uma data e um horário.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmBooking({
        teacherId: teacher.id,
        scheduledDate: selectedDate,
        startTime: selectedTime,
        topic,
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
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Escolher Horário & Reservar</h3>
            <p className="text-xs text-neutral-500">Aula particular de 50 min com {teacher.name}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
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
            <label className="block text-xs font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              2. Horários Disponíveis do Professor
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeOptions.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-500 text-white shadow-xs'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tópico da Aula */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              3. O que você gostaria de praticar nessa aula?
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Treino de conversação para viagem, tirar dúvidas de gramática ou entrevista de emprego..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Resumo de Preço */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
            <span className="text-neutral-500">Valor da Aula (50 min):</span>
            <span className="font-extrabold text-neutral-900 text-sm">
              R$ {teacher.hourlyPriceBrl.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
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
              <span>{isSubmitting ? 'Reservando...' : 'Confirmar Reserva & Pagar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
