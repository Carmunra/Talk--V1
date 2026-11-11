import { AppNotification, UserRole } from '../types';
import { ValidationError } from '../errors/DomainError';

export class AppNotificationEntity implements AppNotification {
  public id: string;
  public userId: string;
  public userRole: UserRole;
  public title: string;
  public message: string;
  public type: 'BOOKING' | 'PAYMENT' | 'LESSON' | 'REVIEW' | 'SYSTEM';
  public read: boolean;
  public relatedLessonId?: string;
  public createdAt: string;

  constructor(data: AppNotification) {
    if (!data.id || !data.userId || !data.title || !data.message) {
      throw new ValidationError('Notificação deve conter id, userId, título e mensagem.');
    }
    this.id = data.id;
    this.userId = data.userId;
    this.userRole = data.userRole || UserRole.Student;
    this.title = data.title.trim();
    this.message = data.message.trim();
    this.type = data.type || 'SYSTEM';
    this.read = data.read ?? false;
    this.relatedLessonId = data.relatedLessonId;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  public markAsRead(): void {
    this.read = true;
  }

  public toJSON(): AppNotification {
    return {
      id: this.id,
      userId: this.userId,
      userRole: this.userRole,
      title: this.title,
      message: this.message,
      type: this.type,
      read: this.read,
      relatedLessonId: this.relatedLessonId,
      createdAt: this.createdAt,
    };
  }
}
