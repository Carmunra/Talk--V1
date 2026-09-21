import { TeacherRecommendationsQueryDTO } from '../dto';
import {
  Student,
  MatchRecommendation,
  IStudentRepository,
  ITeacherRepository,
} from '../../domain/types';
import { MatchingService } from '../../domain/services/matchingService';

export class GetTeacherRecommendationsUseCase {
  constructor(
    private readonly teacherRepo: ITeacherRepository,
    private readonly studentRepo: IStudentRepository
  ) {}

  public async execute(query: TeacherRecommendationsQueryDTO): Promise<MatchRecommendation[]> {
    const teachers = await this.teacherRepo.findAll();

    let student = query.studentId ? await this.studentRepo.findById(query.studentId) : null;

    const defaultStudent: Student = {
      id: 'query-student',
      name: 'Aluno Consulta',
      email: 'temp@talke.com',
      goal: query.goal,
      level: query.level,
      hasCompletedDiagnostic: true,
      walletBalanceBrl: 0,
      totalLessonsCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    const targetStudent = student || defaultStudent;
    const matches: MatchRecommendation[] = MatchingService.rankTeachers(targetStudent, teachers);

    if (query.maxPriceBrl) {
      return matches.filter((m: MatchRecommendation) => m.teacher.hourlyPriceBrl <= query.maxPriceBrl!);
    }

    return matches;
  }
}

