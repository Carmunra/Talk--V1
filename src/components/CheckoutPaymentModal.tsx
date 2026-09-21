import React, { useState } from 'react';
import { X, CreditCard, QrCode, Wallet, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import { Lesson, PaymentMethod, Student } from '../domain/types';
import { CommissionService } from '../domain/services/commissionService';

interface CheckoutPaymentModalProps {
  lesson: Lesson;
  currentStudent: Student;
  onClose: () => void;
  onPaymentSuccess: (updatedLesson: Lesson, newWalletBalance?: number) => void;
}

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  lesson,
  currentStudent,
  onClose,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.Pix);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commission = CommissionService.calculateCommission(lesson.priceBrl);
  const pixData = CommissionService.generatePixData(lesson.priceBrl, lesson.id);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixData.pixCopyPaste);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          studentId: currentStudent.id,
          method,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao processar pagamento.');
      }

      const data = await res.json();
      onPaymentSuccess(data.lesson, data.newWalletBalanceBrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha na transação.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Pagamento Seguro Talkê</h3>
            <p className="text-xs text-neutral-500">
              Garantia de retenção segura até a conclusão da aula
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Pilot Phase Notice */}
        <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center gap-2 text-xs text-cyan-900 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 animate-pulse" />
          <span>
            <strong>Fase Piloto Ativa:</strong> As transações são processadas e confirmadas com custódia Talkê sem cobrança bancária real durante os testes.
          </span>
        </div>

        {/* Resumo da Aula */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Professor:</span>
            <span className="font-bold text-neutral-900">{lesson.teacherName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Data & Horário:</span>
            <span className="font-semibold text-neutral-800">
              {lesson.scheduledDate} às {lesson.startTime} (50 min)
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-neutral-700 font-semibold">Valor da Aula:</span>
            <span className="text-base font-black text-neutral-900">
              R$ {lesson.priceBrl.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Breakdown Talkê */}
          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-neutral-500 space-y-1">
            <div className="flex justify-between">
              <span>Taxa de Serviço Talkê (15%):</span>
              <span className="font-medium text-blue-600">
                R$ {commission.platformFeeBrl.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Repasse Direto ao Professor:</span>
              <span className="font-medium text-emerald-600">
                R$ {commission.teacherNetBrl.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Método de Pagamento */}
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
            Escolha como Deseja Pagar
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* PIX */}
            <button
              type="button"
              onClick={() => setMethod(PaymentMethod.Pix)}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                method === PaymentMethod.Pix
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>PIX Instantâneo</span>
            </button>

            {/* Cartão de Crédito */}
            <button
              type="button"
              onClick={() => setMethod(PaymentMethod.CreditCard)}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                method === PaymentMethod.CreditCard
                  ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Cartão de Crédito</span>
            </button>

            {/* Saldo em Carteira */}
            <button
              type="button"
              onClick={() => setMethod(PaymentMethod.Wallet)}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                method === PaymentMethod.Wallet
                  ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 ring-2 ring-cyan-500/20 shadow-xs'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Wallet className="w-5 h-5 text-cyan-600" />
              <span>Saldo Carteira</span>
              <span className="text-[10px] text-neutral-500 font-normal">
                R$ {currentStudent.walletBalanceBrl.toFixed(2)}
              </span>
            </button>
          </div>
        </div>

        {/* Detalhe do Método Escolhido */}
        <div className="mt-4 p-4 rounded-xl border border-neutral-200 bg-white">
          {method === PaymentMethod.Pix && (
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold text-neutral-700 block">
                Escaneie o QR Code PIX com o app do seu banco:
              </span>
              <div className="w-40 h-40 mx-auto p-2 bg-white rounded-xl border border-neutral-200 shadow-xs flex items-center justify-center">
                <img
                  src={pixData.pixQrCode}
                  alt="QR Code PIX"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.pixCopyPaste}
                  className="flex-1 p-2 text-[10px] font-mono border border-neutral-200 rounded-lg bg-neutral-50 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {method === PaymentMethod.CreditCard && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Número do Cartão</label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8921"
                  defaultValue="4532 8921 4455 1209"
                  className="w-full p-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Validade</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    defaultValue="08/29"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    defaultValue="842"
                    className="w-full p-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {method === PaymentMethod.Wallet && (
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Saldo Atual em Carteira:</span>
                <span className="font-bold text-neutral-900 text-sm">
                  R$ {currentStudent.walletBalanceBrl.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between items-center text-rose-600">
                <span>Valor a Debitar:</span>
                <span className="font-bold">- R$ {lesson.priceBrl.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-100 font-bold text-neutral-800">
                <span>Saldo Restante após compra:</span>
                <span>
                  R$ {(currentStudent.walletBalanceBrl - lesson.priceBrl).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selo de Segurança */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Pagamento protegido pela Talkê Custódia Segura</span>
        </div>

        {/* Ações */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:opacity-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Validando Transação...'
                : method === PaymentMethod.Pix
                ? 'Confirmar Pagamento PIX'
                : 'Pagar R$ ' + lesson.priceBrl.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
