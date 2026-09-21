import { ValidationError } from '../errors/DomainError';

/**
 * Value Object: TimeSlot
 * Enforces start/end time validations, overlap calculations, and duration invariants.
 */
export class TimeSlot {
  constructor(
    public readonly startTime: string, // "09:00"
    public readonly endTime: string    // "10:00"
  ) {
    if (!TimeSlot.isValidTimeString(startTime) || !TimeSlot.isValidTimeString(endTime)) {
      throw new ValidationError(`Formato de hora inválido (${startTime} - ${endTime}). Use o padrão HH:mm.`);
    }

    if (this.toMinutes(startTime) >= this.toMinutes(endTime)) {
      throw new ValidationError(`Horário de início (${startTime}) deve ser anterior ao de término (${endTime}).`);
    }
  }

  public static isValidTimeString(timeStr: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
  }

  public toMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public get durationMinutes(): number {
    return this.toMinutes(this.endTime) - this.toMinutes(this.startTime);
  }

  public overlapsWith(other: TimeSlot): boolean {
    const startA = this.toMinutes(this.startTime);
    const endA = this.toMinutes(this.endTime);
    const startB = other.toMinutes(other.startTime);
    const endB = other.toMinutes(other.endTime);

    return Math.max(startA, startB) < Math.min(endA, endB);
  }

  public containsTime(timeStr: string): boolean {
    const t = this.toMinutes(timeStr);
    return t >= this.toMinutes(this.startTime) && t < this.toMinutes(this.endTime);
  }
}
