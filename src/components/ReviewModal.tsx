import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { Lesson } from '../domain/types';
import { useDialog } from '../lib/useDialog';

interface ReviewModalProps {
  lesson: Lesson;
  onClose: () => void;
  onSubmitReview: (
    lessonId: string,
    rating: number,
    comment: string,
    tags: string[],
  ) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ lesson, onClose, onSubmitReview }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Excelente didática',
    'Muito paciente',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialog = useDialog(onClose, !isSubmitting);
  const [error, setError] = useState<string | null>(null);

  const availableTags = [
    'Excelente didática',
    'Muito paciente',
    'Pontual',
    'Foco prático',
    'Pronúncia clara',
    'Feedback construtivo',
    'Recomendo muito',
    'Prepara para o mercado',
  ];

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((tag) => tag !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitReview(
        lesson.id,
        rating,
        comment.trim() || 'Ótima aula! Aprendi bastante e me senti seguro para falar.',
        selectedTags,
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Avaliar aula"
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Avaliar Aula Talkê</h3>
            <p className="text-xs text-neutral-500">
              Sua avaliação ajuda a comunidade e valoriza o trabalho de {lesson.teacherName}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar avaliação"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Estrelas */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-semibold text-neutral-600">
              Qual a sua nota para a aula com {lesson.teacherName}?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating ?? rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={star + (star === 1 ? ' estrela' : ' estrelas')}
                    aria-pressed={rating === star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 text-neutral-200 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-amber-600 block">
              {rating === 5 && 'Sensacional! Superou as expectativas'}
              {rating === 4 && 'Muito boa! Aprendizado produtivo'}
              {rating === 3 && 'Boa, atendeu ao básico'}
              {rating === 2 && 'Pode melhorar em alguns pontos'}
              {rating === 1 && 'Não atendeu ao esperado'}
            </span>
          </div>

          {/* Destaques / Tags */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Destaques da experiência:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold ring-1 ring-amber-400/30'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Escreva seu feedback (opcional)
            </label>
            <textarea
              aria-label="Comentário sobre a aula"
              maxLength={1000}
              rows={3}
              placeholder="O que você mais gostou na didática ou na postura do professor?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
