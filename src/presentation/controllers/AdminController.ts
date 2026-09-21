import { Request, Response } from 'express';
import { container } from '../../infrastructure/container';

export class AdminController {
  public static async metrics(_req: Request, res: Response) {
    try {
      const metrics = await container.getAdminMetricsUseCase.execute();
      res.json(metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao calcular métricas administrativas';
      res.status(500).json({ error: msg });
    }
  }

  public static async notifications(req: Request, res: Response) {
    try {
      const userId = (req.query.userId as string) || 'all';
      const notifs = await container.notificationRepo.findByUserId(userId);
      res.json(notifs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar notificações';
      res.status(500).json({ error: msg });
    }
  }

  public static async markNotificationRead(req: Request, res: Response) {
    try {
      await container.notificationRepo.markAsRead(req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao marcar notificação';
      res.status(500).json({ error: msg });
    }
  }
}
