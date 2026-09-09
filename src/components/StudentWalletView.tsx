import React, { useState } from 'react';
import { Wallet, Plus, ShieldCheck, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Student } from '../domain/types';

interface StudentWalletViewProps {
  currentStudent: Student;
  onTopUp: (amount: number) => Promise<void>;
  onGoToTeachers: () => void;
}

export const StudentWalletView: React.FC<StudentWalletViewProps> = ({
  currentStudent,
  onTopUp,
  onGoToTeachers,
}) => {
  const [rechargeAmount, setRechargeAmount] = useState<number>(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const presets = [50, 100, 150, 300];

  const handleRecharge = async () => {
    setIsProcessing(true);
    setSuccessMsg(null);
    try {
      await onTopUp(rechargeAmount);
      setSuccessMsg(`Recarga de R$ ${rechargeAmount.toFixed(2)} efetuada com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao recarregar.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balance Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-200 text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            Carteira Digital Talkê
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mt-2">
            R$ {currentStudent.walletBalanceBrl.toFixed(2).replace('.', ',')}
          </h2>
          <p className="text-xs text-blue-100 mt-2 max-w-md leading-relaxed">
            Saldo pronto para pagamento instantâneo de aulas particulares com qualquer professor na plataforma.
          </p>
        </div>

        <button
          onClick={onGoToTeachers}
          className="px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-2xl shadow-xs transition-colors shrink-0 text-center"
        >
          Explorar Professores
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Recarga Rápida */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900">Recarregar Saldo da Carteira</h3>
          <p className="text-xs text-neutral-500">
            Adicione créditos para agendar suas aulas sem precisar digitar dados de cartão a cada reserva.
          </p>
        </div>

        {/* Preset chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presets.map((p) => {
            const isSelected = rechargeAmount === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setRechargeAmount(p)}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold'
                }`}
              >
                <span className="text-xs text-neutral-400 block font-normal">Valor:</span>
                <span className="text-sm">R$ {p},00</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Processamento PIX instantâneo e seguro</span>
          </div>

          <button
            onClick={handleRecharge}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isProcessing ? 'Confirmando...' : `Recarregar R$ ${rechargeAmount},00`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
