import React, { useState } from 'react';
import { X, User, Mail, Target } from 'lucide-react';
import { LearningGoal, LearningGoalLabels } from '../domain/types';

interface StudentRegisterModalProps {
  onClose: () => void;
  onSuccess: (newStudent: any) => void;
}

export const StudentRegisterModal: React.FC<StudentRegisterModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState<LearningGoal>(LearningGoal.Conversation);
  const [goalDescription, setGoalDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Por favor, preencha seu nome e e-mail.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          goal,
          goalDescription: goalDescription.trim() || 'Aprender inglês com foco nos meus objetivos.',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar conta.');
      }

      const created = await res.json();
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Criar Conta de Aluno</h3>
            <p className="text-xs text-neutral-500">Junte-se à Talkê e inicie sua jornada de fluência</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Nome Completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ex: Jonathan Oliveira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="Ex: aluno@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Principal Objetivo</label>
            <div className="relative">
              <Target className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <select
                aria-label="Objetivo de aprendizado"
                value={goal}
                onChange={(e) => setGoal(e.target.value as LearningGoal)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.entries(LearningGoalLabels).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Detalhes do Objetivo (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Preciso falar com clientes estrangeiros e passar em entrevistas internacionais."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              className="w-full p-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Criando Conta...' : 'Cadastrar Aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
