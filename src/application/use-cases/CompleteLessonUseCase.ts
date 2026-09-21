import { CompleteLessonDTO } from '../dto';
import {
  Lesson,
  UserRole,
  IStudentRepository,
  ITeacherRepository,
  ILessonRepository,
  INotificationRepository,
  EntityNotFoundError,
} from '../../domain/types';
import { LessonEntity } from '../../domain/entities/LessonEntity';
import { StudentEntity } from '../../domain/entities/StudentEntity';
import { TeacherEntity } from '../../domain/entities/TeacherEntity';
import { AppNotificationEntity } from '../../domain/entities/AppNotificationEntity';

export class CompleteLessonUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly teacherRepo: ITeacherRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  public async execute(dto: CompleteLessonDTO): Promise<Lesson> {
    const lessonData = await this.lessonRepo.findById(dto.lessonId);
    if (!lessonData) {
      throw new EntityNotFoundError('Aula', dto.lessonId);
    }

    const lesson = new LessonEntity(lessonData);
    lesson.complete(dto.whiteboardNotes);

    await this.lessonRepo.save(lesson.toJSON());

    // Update student completion counter
    const studentData = await this.studentRepo.findById(lesson.studentId);
    if (studentData) {
      const student = new StudentEntity(studentData);
      student.completeLesson();
      await this.studentRepo.save(student.toJSON());
    }

    // Update teacher completion counter
    const teacherData = await this.teacherRepo.findById(lesson.teacherId);
    if (teacherData) {
      const teacher = new TeacherEntity(teacherData);
      teacher.recordLessonCompleted();
      await this.teacherRepo.save(teacher.toJSON());
    }

    // Notify student that lesson is ready for review
    await this.notificationRepo.save(
      new AppNotificationEntity({
        id: `notif-${Date.now()}-comp`,
        userId: lesson.studentId,
        userRole: UserRole.Student,
        title: 'Aula Concluída!',
        message: `Sua aula com ${lesson.teacherName} foi concluída. Deixe uma avaliação para o professor!`,
        type: 'LESSON',
        read: false,
        relatedLessonId: lesson.id,
        createdAt: new Date().toISOString(),
      }).toJSON()
    );

    return lesson.toJSON();
  }
}
