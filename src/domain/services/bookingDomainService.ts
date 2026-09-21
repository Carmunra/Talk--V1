import { Teacher, Lesson, LessonStatus } from '../types';
import { ScheduleConflictError, ValidationError } from '../errors/DomainError';

export class BookingDomainService {
  /**
   * Verifies if a proposed lesson time is strictly valid and conflict-free.
   */
  public static validateBookingSlot(params: {
    teacher: Teacher;
    existingTeacherLessons: Lesson[];
    existingStudentLessons?: Lesson[];
    scheduledDate: string; // YYYY-MM-DD
    startTime: string;    // HH:mm
  }): void {
    const { teacher, existingTeacherLessons, existingStudentLessons = [], scheduledDate, startTime } = params;

    // 1. Date format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      throw new ValidationError(`Data de agendamento inválida: '${scheduledDate}'. Formato esperado: AAAA-MM-DD.`);
    }

    // 2. Cannot book in the past
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = (startTime || '00:00').split(':').map(Number);
    const scheduledDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
    if (isNaN(scheduledDateTime.getTime())) {
      throw new ValidationError('Horário ou data inválidos.');
    }
    // Allow small tolerance (e.g. today)
    const now = new Date();
    if (scheduledDateTime < new Date(now.getTime() - 15 * 60 * 1000)) {
      throw new ValidationError('Não é permitido agendar aulas em datas/horários passados.');
    }

    // 3. Teacher availability slot check
    const dayOfWeek = scheduledDateTime.getDay();
    const hasConfiguredAvailability = Array.isArray(teacher.availability) && teacher.availability.length > 0;
    if (hasConfiguredAvailability) {
      const isSlotAvailable = teacher.availability.some(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.startTime === startTime && slot.isAvailable
      );
      if (!isSlotAvailable) {
        throw new ScheduleConflictError(
          `O professor ${teacher.name} não possui horário livre disponível para ${scheduledDate} às ${startTime}.`
        );
      }
    }

    // 4. Check conflicts with other active teacher lessons
    const teacherHasConflict = existingTeacherLessons.some(
      (l) =>
        l.scheduledDate === scheduledDate &&
        l.startTime === startTime &&
        l.status !== LessonStatus.Cancelled
    );
    if (teacherHasConflict) {
      throw new ScheduleConflictError(
        `O professor ${teacher.name} já possui outra aula agendada neste mesmo horário (${startTime}).`
      );
    }

    // 5. Check conflicts with other student lessons
    const studentHasConflict = existingStudentLessons.some(
      (l) =>
        l.scheduledDate === scheduledDate &&
        l.startTime === startTime &&
        l.status !== LessonStatus.Cancelled
    );
    if (studentHasConflict) {
      throw new ScheduleConflictError(
        `Você já possui outra aula agendada em sua agenda para este mesmo horário (${startTime}).`
      );
    }
  }
}
