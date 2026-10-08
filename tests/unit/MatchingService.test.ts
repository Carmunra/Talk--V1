import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MatchingService } from '../../src/domain/services/matchingService';
import { Teacher, Student, ProficiencyLevel, LearningGoal } from '../../src/domain/types';

const mockTeachers: Teacher[] = [
  {
    id: 'tch-biz',
    name: 'Sarah Business',
    email: 'sarah@talke.com',
    headline: 'Especialista em Inglês Corporativo',
    bio: 'Instrutora executiva.',
    hourlyPriceBrl: 110,
    levelsTaught: [ProficiencyLevel.B1_Intermediate, ProficiencyLevel.B2_Upper_Intermediate],
    specialties: [LearningGoal.Business, LearningGoal.Pronunciation],
    languages: ['Inglês', 'Português'],
    certifications: ['CELTA'],
    availability: [],
    rating: 4.95,
    totalReviews: 28,
    totalLessonsCompleted: 150,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tch-exam',
    name: 'David Exams',
    email: 'david@talke.com',
    headline: 'Preparador IELTS / TOEFL',
    bio: 'Preparador oficial.',
    hourlyPriceBrl: 130,
    levelsTaught: [ProficiencyLevel.B2_Upper_Intermediate, ProficiencyLevel.C1_Advanced],
    specialties: [LearningGoal.Exams, LearningGoal.Travel],
    languages: ['Inglês'],
    certifications: ['Master'],
    availability: [],
    rating: 4.9,
    totalReviews: 40,
    totalLessonsCompleted: 200,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
];

const mockStudent: Student = {
  id: 'std-1',
  name: 'Aluno Teste',
  email: 'aluno@talke.com',
  level: ProficiencyLevel.B1_Intermediate,
  goal: LearningGoal.Business,
  hasCompletedDiagnostic: true,
  walletBalanceBrl: 200,
  totalLessonsCompleted: 2,
  createdAt: new Date().toISOString(),
};

describe('MatchingService Domain Service', () => {
  test('ranks teacher matching student goal and level at top with higher compatibility score', () => {
    const results = MatchingService.rankTeachers(mockStudent, mockTeachers);

    assert.strictEqual(results.length, 2);
    // Sarah should be first because of Business specialty and B1 level match
    assert.strictEqual(results[0].teacher.id, 'tch-biz');
    assert.ok(results[0].matchScore >= results[1].matchScore);
    assert.ok(results[0].matchReasons.length > 0);
  });

  test('matches teacher with goal alignment when student has exam goal', () => {
    const examStudent: Student = {
      ...mockStudent,
      goal: LearningGoal.Exams,
      level: ProficiencyLevel.C1_Advanced,
    };
    const results = MatchingService.rankTeachers(examStudent, mockTeachers);

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].teacher.id, 'tch-exam');
    assert.ok(results[0].isGoalMatch);
  });

  test('calculates individual match criteria breakdown', () => {
    const match = MatchingService.calculateMatch(mockStudent, mockTeachers[0]);
    assert.strictEqual(match.isGoalMatch, true);
    assert.strictEqual(match.isLevelMatch, true);
    assert.ok(match.matchScore >= 80);
  });
});
