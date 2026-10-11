import { z } from 'zod';

export const id = z.string().regex(/^[a-zA-Z0-9_-]{1,256}$/);
export const text = z.string().trim().min(1).max(120);
export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const profileSchema = z
  .object({
    name: text,
    accountType: z.enum(['STUDENT', 'TEACHER', 'GUARDIAN']),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    termsVersion: text,
    acceptedTerms: z.literal(true),
  })
  .strict();
export const bookingSchema = z
  .object({
    studentId: id,
    teacherId: id,
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: time,
    topic: z.string().trim().max(500).default(''),
  })
  .strict();
export const teacherSchema = z
  .object({
    headline: text,
    bio: z.string().trim().min(20).max(2000),
    hourlyPriceBrl: z.number().finite().min(10).max(2000),
    levelsTaught: z.array(z.number().int().min(1).max(6)).min(1).max(6),
    specialties: z
      .array(
        z.enum([
          'CONVERSATION',
          'BUSINESS',
          'EXAMS',
          'TRAVEL',
          'BEGINNER_FOUNDATION',
          'PRONUNCIATION',
        ]),
      )
      .max(6),
    languages: z.array(text).max(10),
    certifications: z.array(text).max(10),
    availability: z
      .array(
        z
          .object({
            id,
            dayOfWeek: z.number().int().min(0).max(6),
            dayLabel: text,
            startTime: time,
            endTime: time,
            isAvailable: z.boolean(),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export const diagnosticSchema = z
  .object({
    level: z.number().int().min(1).max(6),
    goal: z.enum([
      'CONVERSATION',
      'BUSINESS',
      'EXAMS',
      'TRAVEL',
      'BEGINNER_FOUNDATION',
      'PRONUNCIATION',
    ]),
    goalDescription: z.string().trim().max(500),
  })
  .strict();
export function appointment(
  date: string,
  start: string,
  now = Date.now(),
): { timestamp: number; weekday: number; startMinutes: number; endMinutes: number } {
  const timestamp = Date.parse(`${date}T${start}:00-03:00`);
  const validDate = new Date(`${date}T12:00:00Z`);
  if (
    !Number.isFinite(timestamp) ||
    !Number.isFinite(validDate.getTime()) ||
    validDate.toISOString().slice(0, 10) !== date ||
    !time.safeParse(start).success ||
    timestamp <= now ||
    timestamp > now + 90 * 86400_000
  )
    throw new Error('Data/horário inválido; agende nos próximos 90 dias (Brasília)');
  const [h, m] = start.split(':').map(Number);
  return {
    timestamp,
    weekday: validDate.getUTCDay(),
    startMinutes: h * 60 + m,
    endMinutes: h * 60 + m + 50,
  };
}
export const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
