import { AppNotification } from '../types';

export interface INotificationRepository {
  findById(id: string): Promise<AppNotification | null>;
  findByUserId(userId: string): Promise<AppNotification[]>;
  save(notification: AppNotification): Promise<AppNotification>;
  markAsRead(id: string): Promise<void>;
}
