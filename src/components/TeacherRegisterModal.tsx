import React, { useState } from 'react';
import { X, User, Mail, DollarSign, Award } from 'lucide-react';
import { ProficiencyLevel, ProficiencyLevelLabels, LearningGoal, LearningGoalLabels } from '../domain/types';

interface TeacherRegisterModalProps {
  onClose: () => void;
  onSuccess: (newTeacher: any) => void;
}

export const TeacherRegisterModal: React.FC<TeacherRegisterModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyPriceBrl, setHourlyPriceBrl] = useState<number>(85);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([
    ProficiencyLevel.A1_Beginner,
    ProficiencyLevel.A2_Elementary,
    ProficiencyLevel.B1_Intermediate,
  ]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<LearningGoal[]>([
    LearningGoal.Conversation,
    LearningGoal.Business,
  ]);
  const [languages, setLanguages] = useState('Português (Nativo), Inglês (Fluente / C2)');
  const [certifications, setCertifications] = useState('TEFL 120h, Certificação Talkê');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLevel = (lvl: number) => {
    if (selectedLevels.includes(lvl)) {
      if (selectedLevels.length > 1) setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const toggleSpecialty = (goal: LearningGoal) => {
    if (selectedSpecialties.includes(goal)) {
      if (selectedSpecialties.length > 1) setSelectedSpecialties(selectedSpecialties.filter((g) => g !== goal));
    } else {
      setSelectedSpecialties([...selectedSpecialties, goal]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !headline.trim()) {
      setError('Por favor, preencha nome, e-mail e headline profissional.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          headline: headline.trim(),
          bio: bio.trim() || 'Professor dedicado a ajudar alunos a destravar o inglês.',
          hourlyPriceBrl: Number(hourlyPriceBrl) || 80,
          levelsTaught: selectedLevels,
          specialties: selectedSpecialties,
          languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
          certifications: certifications.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao cadastrar professor.');
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
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Cadastrar Perfil de Professor</h3>
            <p className="text-xs text-neutral-500">Defina seu conhecimento, preço por hora e comece a ensinar</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Gabriela Santos"
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
                  placeholder="Ex: gabriela@talke.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Headline Profissional (Breve chamada)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Especialista em Conversação Dinâmica & Inglês para TI"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full p-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Biografia & Metodologia de Ensino
            </label>
            <textarea
              rows={3}
              placeholder="Fale sobre sua experiência, certificações e como você conduz suas aulas com os alunos."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preço e Comissão Talkê */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-neutral-900 mb-1">
                  Preço por Aula (50 minutos) em R$
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="40"
                    max="400"
                    step="5"
                    value={hourlyPriceBrl}
                    onChange={(e) => setHourlyPriceBrl(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-1.5 text-sm font-bold border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-neutral-500">Taxa Talkê (15%):</div>
                <div className="font-semibold text-rose-600">- R$ {(hourlyPriceBrl * 0.15).toFixed(2)}</div>
                <div className="text-neutral-900 font-bold mt-0.5">
                  Você recebe: <span className="text-emerald-600">R$ {(hourlyPriceBrl * 0.85).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conhecimento: Níveis Atendidos */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Níveis que Você Ensina (CEFR)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {Object.entries(ProficiencyLevelLabels).map(([numStr, label]) => {
                const lvl = Number(numStr);
                const isSelected = selectedLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`p-2 text-left rounded-lg text-xs border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {label.split(' - ')[0]}: {label.split(' - ')[1]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conhecimento: Especialidades */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Especialidades & Focos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.entries(LearningGoalLabels).map(([key, label]) => {
                const goal = key as LearningGoal;
                const isSelected = selectedSpecialties.includes(goal);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSpecialty(goal)}
                    className={`p-2 text-left rounded-lg text-xs border transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 font-semibold'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Idiomas Falados (separados por vírgula)
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full p-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Certificações (separadas por vírgula)
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {isSubmitting ? 'Salvando...' : 'Publicar Perfil de Professor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
