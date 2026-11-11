export const PLAN_LESSON_CANCELLATION_HOURS = 24;
export const PLAN_LESSON_CANCELLATION_MS = PLAN_LESSON_CANCELLATION_HOURS * 3_600_000;

export function canCancelPlanLesson(scheduledAt: number, now: number) {
  return (
    Number.isFinite(scheduledAt) &&
    Number.isFinite(now) &&
    scheduledAt - now >= PLAN_LESSON_CANCELLATION_MS
  );
}
