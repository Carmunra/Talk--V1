import { ValidationError } from '../errors/DomainError';

export interface CommissionBreakdown {
  grossAmountBrl: number;
  platformRate: number; // e.g., 0.15 (15%)
  platformFeeBrl: number;
  teacherNetBrl: number;
}

export class CommissionService {
  public static readonly DEFAULT_PLATFORM_RATE = 0.15; // 15% Talkê fee

  /**
   * Calculates platform fee and teacher net payout
   */
  public static calculateCommission(
    grossAmountBrl: number,
    platformRate: number = CommissionService.DEFAULT_PLATFORM_RATE
  ): CommissionBreakdown {
    if (!Number.isFinite(grossAmountBrl) || grossAmountBrl <= 0) {
      throw new ValidationError('O valor bruto da aula deve ser maior que zero.');
    }

    if (!Number.isFinite(platformRate) || platformRate < 0 || platformRate > 1) throw new ValidationError('Taxa de comissão inválida.');
    const platformFeeBrl = Math.round(grossAmountBrl * platformRate * 100) / 100;
    const teacherNetBrl = Math.round((grossAmountBrl - platformFeeBrl) * 100) / 100;

    return {
      grossAmountBrl,
      platformRate,
      platformFeeBrl,
      teacherNetBrl,
    };
  }

}
