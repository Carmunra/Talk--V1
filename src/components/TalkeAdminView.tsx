import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Layers,
  Sparkles,
  CreditCard,
  Star,
  CheckCircle,
} from 'lucide-react';
import { Lesson, Review, Student, Teacher } from '../domain/types';

interface TalkeAdminViewProps {
  students: Student[];
  teachers: Teacher[];
}

export const TalkeAdminView: React.FC<TalkeAdminViewProps> = ({
  students,
  teachers,
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((data) => setMetrics(data));

    fetch('/api/lessons')
      .then((res) => res.json())
      .then((data) => setLessons(data));
  }, []);

  return (
    <div className="space-y-8">
      {/* Admin Title */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              Painel de Controle Talkê Core & DDD
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">Visão Geral da Plataforma</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Monitoramento dos pilares de matching inteligente, liquidação financeira de pagamentos, comissão retida (15%), agenda integrada e avaliações.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block">Taxa Talkê Fixa</span>
              <span className="text-lg font-black text-white">15,0% por aula</span>
            </div>
          </div>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-medium">GMV Total Transacionado</span>
            <div className="text-2xl font-black text-white mt-1">
              R$ {metrics?.totalGmvBrl ? metrics.totalGmvBrl.toFixed(2).replace('.', ',') : '0,00'}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Volume bruto na plataforma</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Receita Talkê (Comissão 15%)</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              R$ {metrics?.totalPlatformRevenueBrl ? metrics.totalPlatformRevenueBrl.toFixed(2).replace('.', ',') : '0,00'}
            </div>
            <span className="text-[10px] text-cyan-300 mt-1 block">Take-rate capturado</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Total de Aulas</span>
            <div className="text-2xl font-black text-white mt-1">
              {lessons.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {metrics?.completedLessons || 0} concluídas
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Alunos & Professores</span>
            <div className="text-2xl font-black text-white mt-1">
              {students.length} / {teachers.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Usuários ativos</span>
          </div>
        </div>
      </div>

      {/* Clean Architecture DDD Principles Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Arquitetura DDD & Regras de Negócio Talkê
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-blue-900 mb-1">1. Matching Básico (Domain Service)</h4>
            <p className="text-neutral-600 leading-relaxed">
              O <code className="text-blue-700 font-bold">MatchingService</code> calcula afinidade ponderada (0-99%) considerando objetivo do aluno (+25 pts), nível de proficiência CEFR (+20 pts), avaliação do professor (+10 pts) e disponibilidade na semana.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-blue-900 mb-1">2. Liquidação & Comissão (Domain Service)</h4>
            <p className="text-neutral-600 leading-relaxed">
              O <code className="text-blue-700 font-bold">CommissionService</code> processa a retenção de 15% na liquidação da reserva. O valor líquido é retido em garantia (escrow) até a realização da aula, quando é liberado para saque via PIX.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-blue-900 mb-1">3. Ciclo de Vida da Aula & Avaliação</h4>
            <p className="text-neutral-600 leading-relaxed">
              Transições de estado estritas (<code className="text-blue-700">Requested ➔ Confirmed ➔ InProgress ➔ Completed</code>). A conclusão aciona automaticamente a liberação financeira e o formulário de avaliação mútua.
            </p>
          </div>
        </div>
      </div>

      {/* Agenda & Transações Globais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Global */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Agenda Global de Aulas
            </h4>
            <span className="text-xs text-neutral-500">{lessons.length} sessões</span>
          </div>

          <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
            {lessons.map((l) => (
              <div key={l.id} className="py-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900">
                    {l.studentName} com {l.teacherName}
                  </div>
                  <div className="text-neutral-500 text-[11px]">
                    {l.scheduledDate} às {l.startTime} • {l.topic}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-neutral-900 block">R$ {l.priceBrl.toFixed(2)}</span>
                  <span className="text-[10px] text-cyan-600 font-semibold uppercase">
                    {l.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Transações & Divisão da Comissão */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Livro Razão de Comissões & Repasses
            </h4>
            <span className="text-xs text-emerald-700 font-semibold">15% Taxa Talkê</span>
          </div>

          <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
            {lessons.map((l) => (
              <div key={l.id} className="py-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-800 block">
                    Aula #{l.id.slice(-6)} • {l.teacherName}
                  </span>
                  <span className="text-neutral-400 text-[10px]">
                    Pago por {l.studentName} ({l.paymentMethod || 'PIX'})
                  </span>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="font-black text-neutral-900">R$ {l.priceBrl.toFixed(2)}</div>
                  <div className="text-[10px] text-cyan-700">
                    Talkê: +R$ {l.platformFeeBrl.toFixed(2)} | Docente: R$ {l.teacherNetBrl.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
