import { Request, Response } from 'express';
import { container } from '../../infrastructure/container';
import { DomainError } from '../../domain/errors';
import { ServerFirestoreRepo } from '../../server/db';

export class TeacherController {
  public static async list(_req: Request, res: Response) {
    try {
      const teachers = await container.teacherRepo.findAll();
      res.json(teachers);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar professores';
      res.status(500).json({ error: msg });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const teacher = await container.teacherRepo.findById(req.params.id);
      if (!teacher) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }
      const reviews = await container.reviewRepo.findByTeacherId(teacher.id);
      res.json({
        ...teacher,
        reviews,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar professor';
      res.status(500).json({ error: msg });
    }
  }

  public static async save(req: Request, res: Response) {
    try {
      const body = req.body;
      const teacherId = body.id || `tch-${Date.now()}`;
      const teacher = {
        ...body,
        id: teacherId,
        availability: body.availability || ServerFirestoreRepo.generateDefaultAvailability(),
        createdAt: body.createdAt || new Date().toISOString(),
      };
      const saved = await container.teacherRepo.save(teacher);
      res.status(201).json(saved);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao salvar professor';
      res.status(500).json({ error: msg });
    }
  }

  public static async updateAvailability(req: Request, res: Response) {
    try {
      const { availability } = req.body;
      await container.teacherRepo.updateAvailability(req.params.id, availability);
      const updated = await container.teacherRepo.findById(req.params.id);
      res.json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar disponibilidade';
      res.status(500).json({ error: msg });
    }
  }

  public static async getReviews(req: Request, res: Response) {
    try {
      const reviews = await container.reviewRepo.findByTeacherId(req.params.id);
      res.json(reviews);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar avaliações do professor';
      res.status(500).json({ error: msg });
    }
  }

  public static async getEarnings(req: Request, res: Response) {
    try {
      const teacherId = req.params.id;
      const lessons = await container.lessonRepo.findByTeacherId(teacherId);
      const paidOrCompleted = lessons.filter(
        (l) => l.status === 'COMPLETED' || l.status === 'CONFIRMED' || l.isPaid
      );
      const totalGross = paidOrCompleted.reduce((sum, l) => sum + (l.priceBrl || 0), 0);
      const totalPlatformCommission = Math.round(totalGross * 0.15 * 100) / 100;
      const availableForWithdrawalBrl = Math.round((totalGross - totalPlatformCommission) * 100) / 100;
      res.json({
        teacherId,
        totalGross,
        totalPlatformCommission,
        availableForWithdrawalBrl,
        totalLessonsCount: paidOrCompleted.length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao calcular ganhos do professor';
      res.status(500).json({ error: msg });
    }
  }

  public static async recommendations(req: Request, res: Response) {
    try {
      const { goal, level, maxPrice } = req.query as {
        goal?: string;
        level?: string;
        maxPrice?: string;
      };
      const studentId = (req.params.studentId || req.query.studentId) as string | undefined;
      const matches = await container.getTeacherRecommendationsUseCase.execute({
        studentId,
        goal: goal as any,
        level: level ? Number(level) : undefined,
        maxPriceBrl: maxPrice ? Number(maxPrice) : undefined,
      });
      res.json(matches);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar recomendações';
      res.status(500).json({ error: msg });
    }
  }
}
