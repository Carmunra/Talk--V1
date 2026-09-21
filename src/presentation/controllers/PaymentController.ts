import { Request, Response } from 'express';
import { container } from '../../infrastructure/container';
import { PaymentMethod, PaymentStatus } from '../../domain/types';
import { CommissionService } from '../../domain/services/commissionService';

export class PaymentController {
  public static async list(_req: Request, res: Response) {
    try {
      const payments = await container.paymentRepo.findAll();
      res.json(payments);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar pagamentos';
      res.status(500).json({ error: msg });
    }
  }

  public static async getByStudent(req: Request, res: Response) {
    try {
      const payments = await container.paymentRepo.findByStudentId(req.params.studentId);
      res.json(payments);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar pagamentos do aluno';
      res.status(500).json({ error: msg });
    }
  }

  public static async createIntent(req: Request, res: Response) {
    try {
      const { amount, lessonId, studentId, studentName, method } = req.body;
      const txId = `tx-${Date.now()}`;
      const amountBrl = Number(amount) || 0;
      const split = CommissionService.calculateCommission(amountBrl);
      const pix = CommissionService.generatePixData(amountBrl, txId);

      const tx = {
        id: txId,
        lessonId,
        studentId,
        studentName: studentName || 'Aluno Talkê',
        amountBrl,
        platformFeeBrl: split.platformFeeBrl,
        teacherNetBrl: split.teacherNetBrl,
        method: method || PaymentMethod.Pix,
        status: PaymentStatus.Pending,
        pixCopyPaste: pix.pixCopyPaste,
        pixQrCode: pix.pixQrCode,
        createdAt: new Date().toISOString(),
      };

      const saved = await container.paymentRepo.save(tx);
      res.status(201).json(saved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar intenção de pagamento';
      res.status(500).json({ error: msg });
    }
  }

  public static async processCard(req: Request, res: Response) {
    try {
      const { studentId, amountBrl, cardNumber, cardHolder, installments = 1 } = req.body;
      const student = await container.studentRepo.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Aluno não encontrado.' });
      }

      const amount = Number(amountBrl);
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valor de recarga inválido.' });
      }

      const isPilot = process.env.PILOT_MODE !== 'false';
      const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
      const lastFour = cleanNumber.length >= 4 ? cleanNumber.slice(-4) : '4242';
      const brand = /^4/.test(cleanNumber) ? 'Visa' : /^5/.test(cleanNumber) ? 'Mastercard' : 'Elo';

      student.walletBalanceBrl += amount;
      await container.studentRepo.save(student);

      const txId = `tx-card-${Date.now()}`;
      const transaction = {
        id: txId,
        studentId: student.id,
        studentName: student.name,
        amountBrl: amount,
        platformFeeBrl: Math.round(amount * 0.0399 * 100) / 100,
        teacherNetBrl: amount,
        method: PaymentMethod.CreditCard,
        status: PaymentStatus.Paid,
        createdAt: new Date().toISOString(),
        cardBrand: brand,
        lastFour,
        installments: Number(installments),
        cardHolder: String(cardHolder || 'TITULAR').toUpperCase(),
      };

      await container.paymentRepo.save(transaction);

      await container.notificationRepo.save({
        id: `notif-${Date.now()}-card`,
        userId: student.id,
        userRole: student.id as any,
        title: isPilot ? 'Recarga Piloto Aprovada! 💳' : 'Pagamento Aprovado no Cartão! 💳',
        message: `Recarga de R$ ${amount.toFixed(2)} confirmada. Novo saldo: R$ ${student.walletBalanceBrl.toFixed(2)}.`,
        type: 'PAYMENT',
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        transaction,
        newBalanceBrl: student.walletBalanceBrl,
        authorizationCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        mode: isPilot ? 'PILOT_SANDBOX' : 'LIVE_STRIPE',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar cartão';
      res.status(500).json({ error: msg });
    }
  }

  public static async getGatewayInfo(_req: Request, res: Response) {
    res.json({
      pilotMode: process.env.PILOT_MODE !== 'false',
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      gateway: 'Stripe Brasil / PIX Banco Central',
      activeMethods: ['PIX', 'CREDIT_CARD', 'WALLET'],
      currency: 'BRL',
    });
  }
}

