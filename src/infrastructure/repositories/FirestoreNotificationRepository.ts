import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { AppNotification } from '../../domain/types';
import { ServerFirestoreRepo } from '../../server/db';

export class FirestoreNotificationRepository implements INotificationRepository {
  public async findById(id: string): Promise<AppNotification | null> {
    const all = await ServerFirestoreRepo.getNotificationsForUser('all');
    return all.find((n) => n.id === id) || null;
  }

  public async findByUserId(userId: string): Promise<AppNotification[]> {
    return ServerFirestoreRepo.getNotificationsForUser(userId);
  }

  public async save(notification: AppNotification): Promise<AppNotification> {
    return ServerFirestoreRepo.pushNotification({
      userId: notification.userId,
      userRole: notification.userRole,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedLessonId: notification.relatedLessonId,
    });
  }

  public async markAsRead(id: string): Promise<void> {
    await ServerFirestoreRepo.markNotificationRead(id);
  }
}
