import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TeacherEntity } from '../../src/domain/entities/TeacherEntity';
import { ValidationError } from '../../src/domain/errors/DomainError';
import { ProficiencyLevel, LearningGoal } from '../../src/domain/types';

describe('TeacherEntity Domain Entity', () => {
  test('creates teacher entity with normalized fields', () => {
    const teacher = new TeacherEntity({
      id: 'tch-200',
      name: '  Carla Dias  ',
      email: ' Carla.Dias@Talke.COM ',
      headline: 'Professora de Conversação',
      bio: 'Especialista em destravar a fala',
      hourlyPriceBrl: 90,
      levelsTaught: [ProficiencyLevel.A1_Beginner, ProficiencyLevel.A2_Elementary],
      specialties: [LearningGoal.Conversation],
      languages: ['Português', 'Inglês'],
      certifications: ['TESOL'],
      availability: [],
      rating: 5.0,
      totalReviews: 1,
      totalLessonsCompleted: 5,
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    assert.strictEqual(teacher.name, 'Carla Dias');
    assert.strictEqual(teacher.email, 'carla.dias@talke.com');
    assert.strictEqual(teacher.hourlyPriceMoney.amountBrl, 90);
  });

  test('updates rating recalculating average on new review', () => {
    const teacher = new TeacherEntity({
      id: 'tch-200',
      name: 'Carla Dias',
      email: 'carla@talke.com',
      headline: 'Professora',
      bio: 'Bio',
      hourlyPriceBrl: 90,
      levelsTaught: [],
      specialties: [],
      languages: [],
      certifications: [],
      availability: [],
      rating: 5.0,
      totalReviews: 1,
      totalLessonsCompleted: 10,
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    teacher.applyReview(4.0);
    // (5.0 * 1 + 4.0) / 2 = 4.5
    assert.strictEqual(teacher.rating, 4.5);
    assert.strictEqual(teacher.totalReviews, 2);
  });

  test('throws ValidationError on invalid review rating (< 1 or > 5)', () => {
    const teacher = new TeacherEntity({
      id: 'tch-200',
      name: 'Carla Dias',
      email: 'carla@talke.com',
      headline: 'Professora',
      bio: 'Bio',
      hourlyPriceBrl: 90,
      levelsTaught: [],
      specialties: [],
      languages: [],
      certifications: [],
      availability: [],
      rating: 5.0,
      totalReviews: 0,
      totalLessonsCompleted: 0,
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    assert.throws(() => {
      teacher.applyReview(6.0);
    }, ValidationError);

    assert.throws(() => {
      teacher.applyReview(0);
    }, ValidationError);
  });
});
