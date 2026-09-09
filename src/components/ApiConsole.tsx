import React, { useState } from 'react';
import { Terminal, Play, Layers, Code2 } from 'lucide-react';
import { Student } from '../domain/types';

interface ApiConsoleProps {
  currentStudent: Student | null;
}

interface EndpointDef {
  method: 'GET' | 'POST';
  path: string;
  name: string;
  description: string;
  category: 'Talkê & DDD Core' | 'Aluno & Matching' | 'Professor & Ganhos';
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({ currentStudent }) => {
  const studentId = currentStudent?.id || 'std-001';

  const endpoints: EndpointDef[] = [
    {
      method: 'GET',
      path: '/api/admin/metrics',
      name: 'Métricas da Plataforma (GMV & Comissão 15%)',
      description: 'Cálculo de take-rate da Talkê, liquidação e volume transacionado.',
      category: 'Talkê & DDD Core',
    },
    {
      method: 'GET',
      path: `/api/matching/${studentId}`,
      name: 'Matching Inteligente (Domain Service)',
      description: 'Algoritmo que cruza objetivos do aluno, nível CEFR e especialidades dos professores.',
      category: 'Aluno & Matching',
    },
    {
      method: 'GET',
      path: '/api/students',
      name: 'Listar Alunos (Students Entity)',
      description: 'Consulta entidades de alunos cadastrados, níveis e metas de aprendizado.',
      category: 'Aluno & Matching',
    },
    {
      method: 'GET',
      path: '/api/teachers',
      name: 'Listar Professores (Teachers Entity)',
      description: 'Professores cadastrados, especialidades, preços e reputação.',
      category: 'Professor & Ganhos',
    },
    {
      method: 'GET',
      path: '/api/teachers/tch-001/earnings',
      name: 'Extrato de Ganhos do Docente (CommissionService)',
      description: 'Retorna repasse líquido, taxa Talkê retida (15%) e saldo disponível para saque PIX.',
      category: 'Professor & Ganhos',
    },
    {
      method: 'GET',
      path: '/api/lessons',
      name: 'Listar Aulas (Lessons Entity)',
      description: 'Histórico e agendamentos de aulas na plataforma.',
      category: 'Talkê & DDD Core',
    },
    {
      method: 'GET',
      path: '/api/notifications',
      name: 'Central de Notificações (Events)',
      description: 'Feed de alertas do sistema para reservas, pagamentos e avaliações.',
      category: 'Talkê & DDD Core',
    },
    {
      method: 'GET',
      path: '/weatherforecast',
      name: 'WeatherForecast (Original ASP.NET)',
      description: 'Endpoint de compatibilidade com o template original C# do repositório.',
      category: 'Talkê & DDD Core',
    },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(endpoints[0]);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const handleExecute = async (ep: EndpointDef) => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseData('');
    setExecutionTimeMs(null);

    const start = performance.now();
    try {
      const res = await fetch(ep.path, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      });
      const end = performance.now();
      setExecutionTimeMs(Math.round(end - start));
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseData(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Architecture Info Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 text-neutral-900 font-bold text-sm">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Estrutura Clean Architecture & DDD no Projeto Talkê</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-700 block">Domain Entities & VOs</span>
            <span className="text-neutral-500 mt-1 block">
              Student, Teacher, Lesson, Review, Payment, AvailabilitySlot, ProficiencyLevel, LearningGoal.
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-700 block">Domain Services</span>
            <span className="text-neutral-500 mt-1 block">
              MatchingService (algoritmo de recomendação) e CommissionService (regras de take-rate de 15%).
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-700 block">Repositories</span>
            <span className="text-neutral-500 mt-1 block">
              Map-based persistent repos no backend Node.js, com ciclo de vida completo de estados.
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-700 block">API / Presentation</span>
            <span className="text-neutral-500 mt-1 block">
              Express rodando na porta 3000 integrada ao SPA React e componentes modulares.
            </span>
          </div>
        </div>
      </div>

      {/* Explorer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints List */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Endpoints da API Talkê
          </h3>
          <div className="space-y-1.5">
            {endpoints.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    handleExecute(ep);
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 border border-blue-300 font-semibold'
                      : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 mr-1.5">
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.name}</span>
                  </div>
                  <Play className="w-3 h-3 text-neutral-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Test & Response Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-neutral-900 text-neutral-100 rounded-2xl p-5 font-mono text-xs shadow-md">
            {/* Request Bar */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[11px]">
                  {selectedEndpoint.method}
                </span>
                <span className="text-neutral-200 font-medium">{selectedEndpoint.path}</span>
              </div>
              <button
                onClick={() => handleExecute(selectedEndpoint)}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                {isLoading ? 'Executando...' : 'Executar Request'}
              </button>
            </div>

            {/* Status Header */}
            <div className="flex items-center justify-between text-neutral-400 text-[11px] pt-3 pb-2">
              <div className="flex items-center gap-3">
                <span>Status:</span>
                {responseStatus !== null ? (
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {responseStatus} OK
                  </span>
                ) : (
                  <span className="text-neutral-500">Pronto para envio</span>
                )}
              </div>
              {executionTimeMs !== null && <span>Latência: {executionTimeMs} ms</span>}
            </div>

            {/* Body */}
            <div className="mt-2 bg-neutral-950 rounded-xl p-3 max-h-96 overflow-y-auto border border-neutral-800">
              {isLoading ? (
                <div className="text-neutral-500 py-8 text-center">Processando requisição HTTP...</div>
              ) : responseData ? (
                <pre className="text-neutral-300 leading-relaxed overflow-x-auto text-[11px]">
                  {responseData}
                </pre>
              ) : (
                <div className="text-neutral-600 py-8 text-center">
                  Clique em "Executar Request" para testar o endpoint.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
