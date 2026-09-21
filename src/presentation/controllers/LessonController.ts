import { Request, Response } from 'express';
import { container } from '../../infrastructure/container';
import { LessonStatus, PaymentMethod } from '../../domain/types';
import { DailyVideoService } from '../../infrastructure/services/DailyVideoService';
import { DomainError } from '../../domain/errors';

export class LessonController {
  public static async list(req: Request, res: Response) {
    try {
      const { teacherId, studentId } = req.query as { teacherId?: string; studentId?: string };
      let lessons;
      if (teacherId) {
        lessons = await container.lessonRepo.findByTeacherId(teacherId);
      } else if (studentId) {
        lessons = await container.lessonRepo.findByStudentId(studentId);
      } else {
        lessons = await container.lessonRepo.findAll();
      }
      res.json(lessons);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar aulas';
      res.status(500).json({ error: msg });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const lesson = await container.lessonRepo.findById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: 'Aula não encontrada' });
      }
      res.json(lesson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar aula';
      res.status(500).json({ error: msg });
    }
  }

  public static async book(req: Request, res: Response) {
    try {
      const { studentId, teacherId, scheduledDate, startTime, durationMinutes, topic } = req.body;
      const lesson = await container.bookLessonUseCase.execute({
        studentId,
        teacherId,
        scheduledDate,
        startTime,
        durationMinutes,
        topic,
      });
      res.status(201).json(lesson);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao agendar aula';
      res.status(500).json({ error: msg });
    }
  }

  public static async checkout(req: Request, res: Response) {
    try {
      const { lessonId, studentId, method } = req.body;
      const result = await container.checkoutLessonUseCase.execute({
        lessonId,
        studentId,
        method: method || PaymentMethod.Wallet,
      });
      res.json(result);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao processar checkout da aula';
      res.status(500).json({ error: msg });
    }
  }

  public static async complete(req: Request, res: Response) {
    try {
      const { whiteboardNotes } = req.body;
      const lesson = await container.completeLessonUseCase.execute({
        lessonId: req.params.id,
        whiteboardNotes,
      });
      res.json(lesson);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao concluir aula';
      res.status(500).json({ error: msg });
    }
  }

  public static async updateStatus(req: Request, res: Response) {
    try {
      const { status, whiteboardNotes } = req.body;
      const lesson = await container.lessonRepo.findById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: 'Aula não encontrada' });
      }
      lesson.status = status as LessonStatus;
      if (whiteboardNotes) {
        lesson.whiteboardNotes = whiteboardNotes;
      }
      await container.lessonRepo.save(lesson);
      res.json(lesson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar status da aula';
      res.status(500).json({ error: msg });
    }
  }

  public static async getDailyRoom(req: Request, res: Response) {
    try {
      const lesson = await container.lessonRepo.findById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: 'Aula não encontrada' });
      }
      const roomUrl = await DailyVideoService.getOrCreateRoomUrl(lesson.id);
      lesson.meetingLink = roomUrl;
      await container.lessonRepo.save(lesson);
      res.json({ url: roomUrl });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar sala Daily';
      res.status(500).json({ error: msg });
    }
  }

  public static async review(req: Request, res: Response) {
    try {
      const { teacherId, studentId, rating, comment, tags } = req.body;
      const review = await container.createReviewUseCase.execute({
        lessonId: req.params.id,
        teacherId,
        studentId,
        rating,
        comment,
        tags,
      });
      res.status(201).json({
        success: true,
        review,
        ...review,
      });
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message, code: err.code });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao registrar avaliação';
      res.status(500).json({ error: msg });
    }
  }
}
