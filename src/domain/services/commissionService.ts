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

    const platformFeeBrl = Math.round(grossAmountBrl * platformRate * 100) / 100;
    const teacherNetBrl = Math.round((grossAmountBrl - platformFeeBrl) * 100) / 100;

    return {
      grossAmountBrl,
      platformRate,
      platformFeeBrl,
      teacherNetBrl,
    };
  }

  /**
   * Generates a realistic mock PIX payload and QR code link
   */
  public static generatePixData(amountBrl: number, orderId: string) {
    const code = `00020126580014br.gov.bcb.pix0136talke-${orderId}-pix-key520400005303986540${amountBrl.toFixed(2)}5802BR5910TALKE-LTDA6009SAO-PAULO62070503***6304E8A2`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}`;
    return {
      pixCopyPaste: code,
      pixQrCode: qrCodeUrl,
    };
  }
}
