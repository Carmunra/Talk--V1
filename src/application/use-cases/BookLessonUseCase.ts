import { BookLessonDTO } from '../dto';
import {
  Lesson,
  LessonStatus,
  UserRole,
  IStudentRepository,
  ITeacherRepository,
  ILessonRepository,
  INotificationRepository,
  EntityNotFoundError,
} from '../../domain/types';
import { LessonEntity } from '../../domain/entities/LessonEntity';
import { BookingDomainService } from '../../domain/services/bookingDomainService';
import { AppNotificationEntity } from '../../domain/entities/AppNotificationEntity';

export class BookLessonUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly teacherRepo: ITeacherRepository,
    private readonly lessonRepo: ILessonRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  public async execute(dto: BookLessonDTO): Promise<Lesson> {
    const [student, teacher] = await Promise.all([
      this.studentRepo.findById(dto.studentId),
      this.teacherRepo.findById(dto.teacherId),
    ]);

    if (!student) {
      throw new EntityNotFoundError('Estudante', dto.studentId);
    }
    if (!teacher) {
      throw new EntityNotFoundError('Professor', dto.teacherId);
    }

    // Retrieve active teacher lessons & student lessons to validate conflicts
    const [teacherLessons, studentLessons] = await Promise.all([
      this.lessonRepo.findByTeacherId(teacher.id),
      this.lessonRepo.findByStudentId(student.id),
    ]);

    // Validate domain invariants & availability
    BookingDomainService.validateBookingSlot({
      teacher,
      existingTeacherLessons: teacherLessons,
      existingStudentLessons: studentLessons,
      scheduledDate: dto.scheduledDate,
      startTime: dto.startTime,
    });

    const lessonId = `les-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dailyRoomUrl = `https://talke.daily.co/talke-${lessonId}`;

    const lessonEntity = new LessonEntity({
      id: lessonId,
      studentId: student.id,
      studentName: student.name,
      teacherId: teacher.id,
      teacherName: teacher.name,
      scheduledDate: dto.scheduledDate,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes || 60,
      status: LessonStatus.Confirmed,
      priceBrl: teacher.hourlyPriceBrl,
      platformFeeBrl: 0, // Will be calculated by entity
      teacherNetBrl: 0,
      topic: dto.topic || 'Conversação e objetivos pedagógicos alinhados na Talkê',
      meetingLink: dailyRoomUrl,
      whiteboardNotes: `Aula Talkê: ${teacher.name} e ${student.name}.`,
      isPaid: false,
      hasBeenReviewed: false,
      createdAt: new Date().toISOString(),
    });

    const savedLesson = await this.lessonRepo.save(lessonEntity.toJSON());

    // Dispatch notification to teacher
    await this.notificationRepo.save(
      new AppNotificationEntity({
        id: `notif-${Date.now()}-book`,
        userId: teacher.id,
        userRole: UserRole.Teacher,
        title: 'Nova Aula Agendada!',
        message: `O aluno ${student.name} agendou uma aula para ${dto.scheduledDate} às ${dto.startTime}.`,
        type: 'BOOKING',
        read: false,
        relatedLessonId: savedLesson.id,
        createdAt: new Date().toISOString(),
      }).toJSON()
    );

    return savedLesson;
  }
}
