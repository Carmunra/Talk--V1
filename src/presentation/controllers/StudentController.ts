import { Request, Response } from 'express';
import { container } from '../../infrastructure/container';
import { DomainError } from '../../domain/errors';
import { PaymentMethod } from '../../domain/types';

export class StudentController {
  public static async list(_req: Request, res: Response) {
    try {
      const students = await container.studentRepo.findAll();
      res.json(students);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar alunos';
      res.status(500).json({ error: msg });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const student = await container.studentRepo.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }
      res.json(student);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar aluno';
      res.status(500).json({ error: msg });
    }
  }

  public static async save(req: Request, res: Response) {
    try {
      const body = req.body;
      const studentId = body.id || `std-${Date.now()}`;
      const student = {
        ...body,
        id: studentId,
        walletBalanceBrl: body.walletBalanceBrl ?? 0,
        totalLessonsCompleted: body.totalLessonsCompleted ?? 0,
        createdAt: body.createdAt || new Date().toISOString(),
      };
      const saved = await container.studentRepo.save(student);
      res.status(201).json(saved);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao salvar aluno';
      res.status(500).json({ error: msg });
    }
  }

  public static async updateDiagnostic(req: Request, res: Response) {
    try {
      const { level, goal, goalDescription } = req.body;
      const student = await container.studentRepo.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }
      student.level = level;
      student.goal = goal;
      student.goalDescription = goalDescription;
      student.hasCompletedDiagnostic = true;
      await container.studentRepo.save(student);
      res.json(student);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar diagnóstico';
      res.status(500).json({ error: msg });
    }
  }

  public static async topUpWallet(req: Request, res: Response) {
    try {
      const rawAmount = req.body.amountBrl !== undefined ? req.body.amountBrl : req.body.amount;
      const method = req.body.method;
      const result = await container.topUpWalletUseCase.execute({
        studentId: req.params.id,
        amountBrl: Number(rawAmount) || 0,
        method: method || PaymentMethod.Pix,
      });
      res.json({
        ...result,
        newBalanceBrl: result.student.walletBalanceBrl,
      });
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        return res.status(400).json({ error: err.message });
      }
      const msg = err instanceof Error ? err.message : 'Erro ao recarregar carteira';
      res.status(500).json({ error: msg });
    }
  }
}
