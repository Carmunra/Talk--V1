import { Student, Teacher, MatchRecommendation } from '../types';

export class MatchingService {
  /**
   * Calculates a match score (0-100%) and reasons between a student and a teacher
   */
  public static calculateMatch(student: Student, teacher: Teacher): MatchRecommendation {
    let score = 50; // Base score
    const reasons: string[] = [];
    let isGoalMatch = false;
    let isLevelMatch = false;
    const isAvailabilityMatch = teacher.availability.some((a) => a.isAvailable);

    // 1. Goal match (+25 points)
    if (student.goal && teacher.specialties.includes(student.goal)) {
      score += 25;
      isGoalMatch = true;
      reasons.push('Especialista no seu objetivo principal de aprendizado');
    }

    // 2. Proficiency level match (+20 points)
    if (student.level && teacher.levelsTaught.includes(student.level)) {
      score += 20;
      isLevelMatch = true;
      reasons.push('Experiência comprovada com alunos no seu nível atual');
    }

    // 3. Teacher rating (+10 points for 4.8+)
    if (teacher.rating >= 4.85) {
      score += 10;
      reasons.push(`Altamente avaliado pelos alunos (${teacher.rating.toFixed(1)} ⭐)`);
    } else if (teacher.rating >= 4.7) {
      score += 5;
    }

    // 4. Verification badge (+5 points)
    if (teacher.isVerified) {
      score += 5;
      reasons.push('Professor verificado com documentação validada pela Talkê');
    }

    // Cap at 99%
    const finalScore = Math.min(score, 99);

    return {
      teacher,
      matchScore: finalScore,
      matchReasons: reasons.length > 0 ? reasons : ['Excelente qualificação geral e horários flexíveis'],
      isGoalMatch,
      isLevelMatch,
      isAvailabilityMatch,
    };
  }

  /**
   * Ranks and sorts teachers for a student
   */
  public static rankTeachers(student: Student, teachers: Teacher[]): MatchRecommendation[] {
    return teachers
      .map((t) => this.calculateMatch(student, t))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}
