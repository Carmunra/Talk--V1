import { test, describe } from 'node:test';
import assert from 'node:assert';
import { BookingDomainService } from '../../src/domain/services/bookingDomainService';
import { ScheduleConflictError, ValidationError } from '../../src/domain/errors/DomainError';
import { Teacher, Lesson, LessonStatus, ProficiencyLevel, LearningGoal } from '../../src/domain/types';

const mockTeacher: Teacher = {
  id: 'tch-book',
  name: 'Professor Teste',
  email: 'teacher@talke.com',
  headline: 'Tutor',
  bio: 'Bio',
  hourlyPriceBrl: 100,
  levelsTaught: [ProficiencyLevel.B1_Intermediate],
  specialties: [LearningGoal.Speaking],
  languages: ['Inglês'],
  certifications: [],
  availability: [
    {
      id: 'slot-1',
      dayOfWeek: 1, // Segunda
      dayLabel: 'Segunda-feira',
      startTime: '10:00',
      endTime: '11:00',
      isAvailable: true,
    },
    {
      id: 'slot-2',
      dayOfWeek: 1,
      dayLabel: 'Segunda-feira',
      startTime: '14:00',
      endTime: '15:00',
      isAvailable: false, // Closed
    },
  ],
  rating: 5.0,
  totalReviews: 10,
  totalLessonsCompleted: 50,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

describe('BookingDomainService Domain Service', () => {
  // Pick a future Monday for testing
  const futureMonday = new Date();
  futureMonday.setDate(futureMonday.getDate() + ((1 + 7 - futureMonday.getDay()) % 7 || 7));
  const scheduledDate = futureMonday.toISOString().split('T')[0];

  test('validates and accepts conflict-free slot on available schedule', () => {
    assert.doesNotThrow(() => {
      BookingDomainService.validateBookingSlot({
        teacher: mockTeacher,
        existingTeacherLessons: [],
        existingStudentLessons: [],
        scheduledDate,
        startTime: '10:00',
      });
    });
  });

  test('rejects booking when slot is marked unavailable by teacher', () => {
    assert.throws(() => {
      BookingDomainService.validateBookingSlot({
        teacher: mockTeacher,
        existingTeacherLessons: [],
        scheduledDate,
        startTime: '14:00', // isAvailable: false
      });
    }, ScheduleConflictError);
  });

  test('rejects booking when teacher already has another active lesson at the same time', () => {
    const existingTeacherLessons: Lesson[] = [
      {
        id: 'les-existing',
        studentId: 'std-other',
        studentName: 'Outro Aluno',
        teacherId: mockTeacher.id,
        teacherName: mockTeacher.name,
        scheduledDate,
        startTime: '10:00',
        durationMinutes: 60,
        status: LessonStatus.Confirmed,
        priceBrl: 100,
        platformFeeBrl: 15,
        teacherNetBrl: 85,
        isPaid: true,
        createdAt: new Date().toISOString(),
      },
    ];

    assert.throws(() => {
      BookingDomainService.validateBookingSlot({
        teacher: mockTeacher,
        existingTeacherLessons,
        scheduledDate,
        startTime: '10:00',
      });
    }, ScheduleConflictError);
  });

  test('rejects past bookings', () => {
    assert.throws(() => {
      BookingDomainService.validateBookingSlot({
        teacher: mockTeacher,
        existingTeacherLessons: [],
        scheduledDate: '2020-01-01',
        startTime: '10:00',
      });
    }, ValidationError);
  });

  test('validates malformed date format', () => {
    assert.throws(() => {
      BookingDomainService.validateBookingSlot({
        teacher: mockTeacher,
        existingTeacherLessons: [],
        scheduledDate: '01/01/2026',
        startTime: '10:00',
      });
    }, ValidationError);
  });
});
