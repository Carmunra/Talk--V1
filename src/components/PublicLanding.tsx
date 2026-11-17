import type { ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { TalkeLogo } from './TalkeLogo';

interface PublicLandingProps {
  onLogin: () => void;
  onNavigate: (tab: 'teachers' | 'plans') => void;
  plans: ReactNode;
  teachers: ReactNode;
  minorsEnabled: boolean;
  legalName: string;
  supportEmail: string;
}

export function PublicLanding({
  onLogin,
  onNavigate,
  plans,
  teachers,
  minorsEnabled,
  legalName,
  supportEmail,
}: PublicLandingProps) {
  return (
    <div className="bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#inicio" aria-label="Talkê, início" className="shrink-0 no-underline">
            <TalkeLogo size="md" showSubtitle={false} />
          </a>
          <nav
            aria-label="Navegação da página inicial"
            className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex"
          >
            <a href="#metodologia" className="no-underline hover:text-blue-600">
              Metodologia
            </a>
            <button
              type="button"
              onClick={() => onNavigate('teachers')}
              className="border-0 bg-transparent px-0 text-sm text-slate-600 hover:text-blue-600"
            >
              Professores
            </button>
            <a href="#niveis" className="no-underline hover:text-blue-600">
              Níveis
            </a>
            <button
              type="button"
              onClick={() => onNavigate('plans')}
              className="border-0 bg-transparent px-0 text-sm text-slate-600 hover:text-blue-600"
            >
              Planos
            </button>
            <a href="#faq" className="no-underline hover:text-blue-600">
              Dúvidas
            </a>
          </nav>
          <button
            type="button"
            onClick={onLogin}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Entrar com Google
          </button>
        </div>
      </header>

      <main>
        <section
          id="inicio"
          aria-label="Conheça a Talkê"
          className="overflow-hidden border-b border-slate-100 bg-gradient-to-b from-blue-50 via-white to-white py-16 sm:py-24"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                <Sparkles size={16} /> Inglês conectado aos seus objetivos
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Aprenda a falar inglês com <span className="text-blue-600">naturalidade</span> e
                confiança.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Aulas particulares e 100% online, com conteúdo conectado à sua rotina, ao seu nível
                e aos seus interesses.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://wa.me/5511965802237"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white no-underline shadow-md hover:bg-blue-700"
                >
                  Aula experimental gratuita <ArrowRight size={18} />
                </a>
                <a
                  href="#professores"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 no-underline hover:border-blue-300"
                >
                  <Users size={18} /> Conhecer professores
                </a>
              </div>
              <p className="text-sm text-slate-500">
                A disponibilidade da aula experimental é confirmada pelo atendimento.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/70 sm:p-9">
                <div className="absolute -right-3 -top-3 rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <Sparkles size={24} />
                </div>
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <MessageCircle size={28} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Prática de conversação
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Inglês para a vida real</h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  Converse sobre viagens, trabalho e situações do cotidiano com acompanhamento
                  individual.
                </p>
                <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm font-semibold text-slate-700">
                  <p className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} /> Aulas individuais de 50
                    minutos
                  </p>
                  <p className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} /> Material personalizado
                  </p>
                  <p className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} /> Objetivos e progresso
                    acompanhados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="metodologia" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Como você aprende
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Seu inglês. Seus objetivos.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  title: 'Material personalizado',
                  text: 'Vocabulário, diálogos, leitura, listening e revisões para situações da sua vida.',
                },
                {
                  icon: MessageCircle,
                  title: 'Conversação e prática',
                  text: 'Inglês para viagens, trabalho, vida no exterior e conversas do cotidiano.',
                },
                {
                  icon: Target,
                  title: 'Acompanhamento individual',
                  text: 'Objetivos, feedback e ajustes no percurso de aprendizagem.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <span className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="niveis" className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Seu ponto de partida
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Uma jornada para cada nível
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Do primeiro contato com o idioma às conversas mais avançadas, o conteúdo acompanha
              seus objetivos.
            </p>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['A1–A2', 'Fundamentos e situações do dia a dia'],
                ['B1–B2', 'Autonomia e conversação contínua'],
                ['C1–C2', 'Expressão avançada e confiança'],
              ].map(([level, label]) => (
                <div key={level} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <strong className="text-2xl text-blue-600">{level}</strong>
                  <p className="mt-2 font-semibold text-slate-700">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="professores" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{teachers}</div>
        </section>
        <section id="planos" className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{plans}</div>
        </section>

        <section id="faq" className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Dúvidas frequentes
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Como funciona a Talkê?</h2>
            <div className="mt-8 space-y-3">
              <details className="rounded-2xl border border-slate-200 p-5">
                <summary className="cursor-pointer font-bold">As aulas são individuais?</summary>
                <p className="mt-3 text-slate-600">
                  Sim. As aulas de inglês são particulares e online, com duração de 50 minutos.
                </p>
              </details>
              <details className="rounded-2xl border border-slate-200 p-5">
                <summary className="cursor-pointer font-bold">
                  Como agendo uma aula experimental?
                </summary>
                <p className="mt-3 text-slate-600">
                  Fale com o atendimento pelo WhatsApp. A equipe confirma os horários disponíveis.
                </p>
              </details>
              <details className="rounded-2xl border border-slate-200 p-5">
                <summary className="cursor-pointer font-bold">Posso cancelar uma aula?</summary>
                <p className="mt-3 text-slate-600">
                  Cancele com pelo menos 24 horas de antecedência para devolver o crédito ao plano,
                  mantendo a validade. Pedidos tardios e faltas exigem análise do suporte.
                </p>
              </details>
            </div>
            <p className="mt-8 text-sm text-slate-500">
              {minorsEnabled
                ? 'O cadastro de menores exige um responsável e aprovação do vínculo.'
                : 'O cadastro de menores na plataforma aguarda liberação. Fale com o atendimento para mais informações.'}
            </p>
          </div>
        </section>
        <section className="bg-gradient-to-r from-blue-600 to-sky-600 py-16 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-black">Comece a aprender com a Talkê</h2>
              <p className="mt-2 text-blue-50">
                Converse com a equipe sobre seus objetivos e a aula experimental.
              </p>
            </div>
            <a
              href="https://wa.me/5511965802237"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-6 py-3 font-bold text-blue-700 no-underline hover:bg-blue-50"
            >
              Falar com o atendimento
            </a>
          </div>
        </section>
      </main>
      <footer className="bg-slate-900 py-12 text-sm text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 sm:px-6 lg:flex-row lg:px-8">
          <div>
            <TalkeLogo size="sm" showSubtitle={false} />
            <p className="mt-3">{legalName || 'Talkê em preparação'}</p>
            {supportEmail && (
              <a className="text-slate-300" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            )}
          </div>
          <nav aria-label="Informações legais" className="flex flex-wrap gap-5">
            <a className="text-slate-300" href="/privacidade">
              Aviso de privacidade
            </a>
            <a className="text-slate-300" href="/termos">
              Termos
            </a>
            <a className="text-slate-300" href="/planos">
              Planos
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
