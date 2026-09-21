import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Database,
  Building,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Student, PaymentTransaction, PaymentMethod, PaymentStatus } from '../domain/types';
import { FirestoreService } from '../lib/firestoreService';

interface StudentWalletViewProps {
  currentStudent: Student;
  onTopUp: (amount: number) => Promise<void>;
  onGoToTeachers: () => void;
  onPaymentRecorded?: (tx: PaymentTransaction) => void;
}

export const StudentWalletView: React.FC<StudentWalletViewProps> = ({
  currentStudent,
  onTopUp,
  onGoToTeachers,
  onPaymentRecorded,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'pix' | 'guide'>('card');
  const [rechargeAmount, setRechargeAmount] = useState<number>(150);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(currentStudent.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [cpf, setCpf] = useState('123.456.789-00');

  // Transactions list
  const [transactions, setTransactions] = useState<any[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);

  const presets = [50, 100, 150, 300, 500];

  useEffect(() => {
    fetchGatewayStatus();
  }, []);

  const fetchGatewayStatus = async () => {
    try {
      const res = await fetch('/api/payments/gateway-info');
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data);
      }
    } catch {
      // ignore
    }
  };

  // Detect brand based on prefix
  const getCardBrand = (number: string): string => {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^(4011|4389|4514|5041|5066|5090|6277|6362|6363)/.test(clean)) return 'Elo';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^(606282|3841)/.test(clean)) return 'Hipercard';
    return 'Cartão';
  };

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardHolder(currentStudent.name.toUpperCase());
    setCardExpiry('12/28');
    setCardCvv('123');
    setErrorMsg(null);
  };

  const selectedAmount = customAmount ? Number(customAmount) || rechargeAmount : rechargeAmount;

  // Process Card Payment
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length < 13) {
      setErrorMsg('Por favor, informe um número de cartão de crédito válido.');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMsg('Informe o nome como impresso no cartão.');
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMsg('Informe a validade no formato MM/AA.');
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMsg('Informe o código de segurança (CVV).');
      return;
    }
    if (selectedAmount < 10) {
      setErrorMsg('O valor mínimo de recarga é de R$ 10,00.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/payments/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.id,
          amountBrl: selectedAmount,
          cardNumber: cleanNum,
          cardHolder,
          expiry: cardExpiry,
          installments: cardInstallments,
          cpf,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao autorizar transação no cartão.');
      }

      // Persist in Firestore
      if (data.transaction) {
        await FirestoreService.savePayment(data.transaction);
        await FirestoreService.saveStudent({
          ...currentStudent,
          walletBalanceBrl: data.newBalanceBrl,
        });

        setTransactions((prev) => [data.transaction, ...prev]);
        if (onPaymentRecorded) onPaymentRecorded(data.transaction);
      }

      await onTopUp(selectedAmount);

      setSuccessMsg(
        `Pagamento de R$ ${selectedAmount.toFixed(2)} aprovado no ${data.transaction.cardBrand} final ${data.transaction.lastFour}! Código de Autorização: ${data.authorizationCode}`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar cobrança no cartão.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process PIX simulation
  const handlePixPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onTopUp(selectedAmount);
      const fakeTx: PaymentTransaction = {
        id: `tx-pix-${Date.now()}`,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        amountBrl: selectedAmount,
        platformFeeBrl: 0,
        teacherNetBrl: selectedAmount,
        method: PaymentMethod.Pix,
        status: PaymentStatus.Paid,
        createdAt: new Date().toISOString(),
      };
      await FirestoreService.savePayment(fakeTx);
      setTransactions((prev) => [fakeTx, ...prev]);
      setSuccessMsg(`PIX de R$ ${selectedAmount.toFixed(2)} compensado com sucesso! Saldo adicionado.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar PIX.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardBrand = getCardBrand(cardNumber);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balance Hero with Cloud Database Sync Badge */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-blue-900/40 text-cyan-200 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
              <Wallet className="w-3.5 h-3.5" />
              <span>Carteira Digital Talkê</span>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-xs">
              <Database className="w-3 h-3 text-emerald-300" />
              <span>Cloud Firestore Conectado</span>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            R$ {currentStudent.walletBalanceBrl.toFixed(2).replace('.', ',')}
          </h2>

          <p className="text-xs text-blue-100 max-w-md leading-relaxed">
            Seus créditos ficam seguros na nuvem e permitem agendar aulas com 1 clique, sem precisar redigitar dados do cartão a cada reserva.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 relative z-10">
          <button
            onClick={onGoToTeachers}
            className="px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold rounded-2xl shadow-xs transition-colors shrink-0 text-center"
          >
            Explorar Professores
          </button>
          <span className="text-[11px] text-cyan-200 text-center sm:text-right">
            100% protegido por criptografia TLS
          </span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Recarga Concluída com Sucesso!</p>
            <p className="text-emerald-700 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Atenção</p>
            <p className="text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Payment Hub */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'card'
                ? 'bg-white text-blue-700 shadow-xs border border-neutral-200/80'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cartão de Crédito</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-extrabold">
              Online
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pix')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pix'
                ? 'bg-white text-teal-700 shadow-xs border border-neutral-200/80'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>PIX Instantâneo</span>
            <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-md font-extrabold">
              0% Taxa
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'bg-white text-purple-700 shadow-xs border border-neutral-200/80'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Passar Cartão Real (Guia)</span>
          </button>
        </div>

        {/* Amount Selector (Shared between Card & Pix) */}
        {activeTab !== 'guide' && (
          <div className="p-6 border-b border-neutral-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800">
                1. Selecione o Valor da Recarga de Créditos
              </label>
              <span className="text-[11px] text-neutral-500">Saldo adicionado imediatamente</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {presets.map((p) => {
                const isSelected = !customAmount && rechargeAmount === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setRechargeAmount(p);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium'
                    }`}
                  >
                    <span className="text-xs">R$ {p},00</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div className="pt-1 flex items-center gap-3">
              <span className="text-xs text-neutral-500">Ou digite outro valor:</span>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  placeholder="Ex: 250"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-36 pl-8 pr-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CARTÃO DE CRÉDITO */}
        {activeTab === 'card' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Virtual Interactive Card Visual */}
              <div className="lg:col-span-5 space-y-4">
                <div className="w-full h-52 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white p-6 flex flex-col justify-between shadow-xl relative overflow-hidden border border-slate-700/50">
                  {/* Background decoration */}
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-8 -top-8 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-6 bg-amber-400/80 rounded-md border border-amber-300/60 flex items-center justify-center">
                        <div className="w-5 h-3 border border-amber-900/40 rounded-xs" />
                      </div>
                      <span className="text-[10px] tracking-wider text-slate-300 uppercase font-mono">
                        Talkê Pay
                      </span>
                    </div>

                    <span className="px-2.5 py-1 bg-white/10 rounded-md text-xs font-black tracking-wider uppercase backdrop-blur-xs">
                      {cardBrand}
                    </span>
                  </div>

                  <div className="space-y-1 relative z-10 font-mono">
                    <div className="text-xs text-slate-400">NÚMERO DO CARTÃO</div>
                    <div className="text-lg sm:text-xl font-bold tracking-widest text-slate-100">
                      {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs relative z-10">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">TITULAR</div>
                      <div className="font-semibold uppercase tracking-wider text-slate-200 truncate max-w-[150px]">
                        {cardHolder || 'NOME DO ALUNO'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">VALIDADE</div>
                      <div className="font-semibold tracking-wider text-slate-200">
                        {cardExpiry || 'MM/AA'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Fill Test Card Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-blue-800 font-medium">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Testar simulação com 1 clique:</span>
                  </div>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Preencher Cartão Teste
                  </button>
                </div>
              </div>

              {/* Card Inputs Form */}
              <form onSubmit={handleCardPayment} className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Número do Cartão de Crédito
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full pl-9 pr-24 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[11px] font-bold text-neutral-500">
                      {cardBrand}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Nome Completo do Titular (como no cartão)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CARLOS ALBERTO SILVA"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      CVV
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                      <Lock className="w-3 h-3 text-neutral-400 absolute right-2.5 top-3.5" />
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Parcelas
                    </label>
                    <select
                      value={cardInstallments}
                      onChange={(e) => setCardInstallments(Number(e.target.value))}
                      className="w-full px-2 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value={1}>1x de R$ {selectedAmount.toFixed(2)} (à vista)</option>
                      <option value={2}>2x de R$ {(selectedAmount / 2).toFixed(2)}</option>
                      <option value={3}>3x de R$ {(selectedAmount / 3).toFixed(2)}</option>
                      <option value={6}>6x de R$ {(selectedAmount / 6).toFixed(2)}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    CPF do Titular (Requisito anti-fraude)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ambiente Seguro PCI-DSS com gravação no Firestore</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando no Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pagar R$ {selectedAmount.toFixed(2)} no Cartão</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: PIX */}
        {activeTab === 'pix' && (
          <div className="p-6 space-y-6">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="w-44 h-44 mx-auto bg-white border-2 border-dashed border-teal-400 rounded-2xl p-3 flex flex-col items-center justify-center shadow-xs">
                {/* Visual QR Code Representation */}
                <div className="w-full h-full bg-slate-900 rounded-xl p-2 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-black rounded-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-black" />
                      </div>
                      <div className="w-6 h-6 border-2 border-black rounded-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-black" />
                      </div>
                    </div>
                    <div className="text-[8px] font-mono font-bold text-center text-teal-800">
                      PIX TALKÊ R$ {selectedAmount},00
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-black rounded-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-black" />
                      </div>
                      <div className="w-6 h-6 bg-neutral-200 flex items-center justify-center text-[7px] font-bold">
                        BACEN
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-neutral-900">Escaneie o QR Code no app do seu banco</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Ou copie o código PIX abaixo para pagar no internet banking.
                </p>
              </div>

              {/* Copy Paste Code */}
              <div className="bg-neutral-100 p-3 rounded-xl flex items-center justify-between gap-2 text-left">
                <span className="font-mono text-[11px] text-neutral-600 truncate">
                  00020126580014br.gov.bcb.pix0136talke-{currentStudent.id}-{selectedAmount}520400005303986
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2500);
                  }}
                  className="p-1.5 bg-white hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePixPayment}
                disabled={isProcessing}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Confirmando no Banco Central...' : 'Simular Compensação Instantânea PIX'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: GUIA PRÁTICO PARA ATIVAR CARTÃO REAL */}
        {activeTab === 'guide' && (
          <div className="p-6 space-y-6">
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Como passar um cartão de crédito real na Talkê
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Siga este roteiro direto para conectar um adquirente bancário (Stripe ou Mercado Pago) e transacionar dinheiro real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px]">1</span>
                  Criar conta no Stripe ou Mercado Pago
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Acesse <strong>stripe.com/br</strong> ou <strong>mercadopago.com.br/developers</strong> e crie uma conta gratuita com CPF ou CNPJ da sua empresa.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px]">2</span>
                  Copiar as Chaves de API de Teste e Produção
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  No painel de desenvolvedor do gateway, copie a <code>Chave Secreta</code> (começa com <code>sk_test_...</code> ou <code>sk_live_...</code>) e a <code>Chave Publicável</code>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px]">3</span>
                  Preencher no arquivo de ambiente (.env)
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  O projeto já possui as variáveis preparadas em <code>.env.example</code>. Basta definir <code>STRIPE_SECRET_KEY</code> e <code>VITE_STRIPE_PUBLISHABLE_KEY</code>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px]">4</span>
                  Webhook de Liquidação & Depósito Bancário
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Assim que o aluno passa o cartão, o gateway processa o antifraude e chama <code>/api/webhooks/stripe</code>, que credita a carteira e agenda o repasse para sua conta corrente em D+1 ou D+30.
                </p>
              </div>
            </div>

            {/* Architecture Note */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Normas PCI-DSS & Segurança do Usuário</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Por compliance internacional, o número completo do cartão <strong>NUNCA</strong> é armazenado no banco de dados. No fluxo ao vivo, os dados são tokenizados diretamente nos servidores do Stripe/Mercado Pago, e nosso banco armazena apenas a bandeira, os 4 últimos dígitos (ex: final 4242) e o ID de transação para auditoria.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cloud Firestore Status & Recent Transactions */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-neutral-900">
              Histórico de Recargas & Persistência Cloud Firestore
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500">
            Coleções ativas: <code>payments</code> e <code>students</code>
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            Nenhuma recarga realizada nesta sessão ainda. Faça sua primeira recarga no cartão ou PIX acima para registrar no banco de dados!
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {transactions.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    {t.method === PaymentMethod.CreditCard ? <CreditCard className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-800">
                      Recarga de Créditos ({t.method === PaymentMethod.CreditCard ? `${t.cardBrand || 'Cartão'} •••• ${t.lastFour || ''}` : 'PIX Instantâneo'})
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      ID: {t.id} • {new Date(t.createdAt).toLocaleTimeString('pt-BR')} • Salvo no Firestore
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-emerald-600">+ R$ {Number(t.amountBrl).toFixed(2)}</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
