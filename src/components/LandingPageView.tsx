import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Video,
  Users,
  Award,
  ShieldCheck,
  Calendar,
  MessageSquare,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  Zap,
  Globe,
  TrendingUp,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Send,
  Lock,
  Compass,
  Laptop,
  Check,
  X as XIcon,
} from 'lucide-react';
import { TalkeLogo } from './TalkeLogo';
import { UserRole } from '../domain/types';

interface LandingPageViewProps {
  onEnterApp?: () => void;
  onOpenDiagnostic?: () => void;
  onSelectTeacherDirectly?: () => void;
  onEnterPlatform?: (role?: UserRole) => void;
  onExploreTeachers?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterApp,
  onOpenDiagnostic,
  onSelectTeacherDirectly,
  onEnterPlatform,
  onExploreTeachers,
}) => {
  const handleEnter = (role?: UserRole) => {
    if (onEnterPlatform) onEnterPlatform(role);
    else if (onEnterApp) onEnterApp();
  };

  const handleExplore = () => {
    if (onExploreTeachers) onExploreTeachers();
    else if (onSelectTeacherDirectly) onSelectTeacherDirectly();
    else if (onEnterApp) onEnterApp();
  };

  const handleDiagnostic = () => {
    if (onOpenDiagnostic) onOpenDiagnostic();
    else handleEnter(UserRole.Student);
  };

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Active level tab
  const [activeLevelTab, setActiveLevelTab] = useState<'basico' | 'intermediario' | 'avancado'>('basico');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('Dúvidas sobre Aulas');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitted(true);
  };

  const faqItems = [
    {
      q: 'Como funciona a primeira aula na Talkê?',
      a: 'Você realiza um diagnóstico rápido de nível e objetivos (ou escolhe diretamente seu professor favorito). A primeira aula é 100% focada em conversação e no alinhamento do seu plano pedagógico individual. O professor avalia seu nível CEFR, identifica seus pontos de bloqueio e já define a lição inicial.',
    },
    {
      q: 'Preciso pagar mensalidade ou assinar contrato de fidelidade de 1 ano?',
      a: 'Não! Na Talkê você tem liberdade total. Você pode agendar aulas avulsas ou adquirir pacotes flexíveis de créditos que valem por 12 meses. Sem fidelidade, sem multas de cancelamento e sem pegadinhas.',
    },
    {
      q: 'Como funciona a sala de aula virtual? Preciso instalar algum aplicativo pesado?',
      a: 'Tudo roda 100% no seu navegador moderno (Google Chrome, Edge, Safari, Firefox). A sala virtual Talkê conta com vídeo de alta definição, quadro branco digital para anotações em tempo real, apresentação integrada de slides e compartilhamento de tela com um clique.',
    },
    {
      q: 'O professor sabe exatamente o que eu estudei nas aulas anteriores?',
      a: 'Sim! Esse é um dos maiores diferenciais da Talkê: a cada aula, o professor registra em nuvem o seu "Ponto de Retomada" (onde você parou, quais exercícios concluiu, seu vocabulário fixado e a tarefa de casa). Mesmo se você fizer aulas com professores diferentes, todos sabem exatamente onde você parou.',
    },
    {
      q: 'Posso remarcar uma aula agendada?',
      a: 'Sim. Você pode reagendar sua aula com até 6 horas de antecedência diretamente no seu painel, sem nenhum custo adicional ou perda de créditos.',
    },
    {
      q: 'Quais são as formas de pagamento aceitas?',
      a: 'Aceitamos PIX (com liberação e confirmação instantânea de créditos) e Cartão de Crédito (com parcelamento em pacotes maiores). Todos os pagamentos ficam protegidos em garantia (escrow) até a realização da sua aula.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6FAFE] text-neutral-800 flex flex-col font-sans selection:bg-blue-400 selection:text-white">
      {/* ===================================================================== */}
      {/* TOP NOTIFICATION / PROMO BAR */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-blue-500 via-sky-400 to-blue-400 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
        <span>Garantia Talkê: Primeira aula com satisfação garantida ou seu crédito de volta.</span>
        <button
          onClick={handleDiagnostic}
          className="underline hover:text-white ml-1 font-extrabold cursor-pointer"
        >
          Fazer Diagnóstico Gratuito ➔
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MAIN NAVBAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <TalkeLogo size="lg" />

            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-neutral-600">
              <a href="#como-funciona" className="hover:text-blue-600 transition-colors">
                Como Funciona
              </a>
              <a href="#metodologia" className="hover:text-blue-600 transition-colors">
                Níveis & Metodologia
              </a>
              <a href="#diferenciais" className="hover:text-blue-600 transition-colors">
                Diferenciais
              </a>
              <a href="#sobre-nos" className="hover:text-blue-600 transition-colors">
                Sobre Nós
              </a>
              <a href="#professores" className="hover:text-blue-600 transition-colors">
                Professores
              </a>
              <a href="#precos" className="hover:text-blue-600 transition-colors">
                Planos & Preços
              </a>
              <a href="#faq" className="hover:text-blue-600 transition-colors">
                FAQ
              </a>
              <a href="#contato" className="hover:text-blue-600 transition-colors">
                Contato
              </a>
            </nav>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleEnter()}
              className="px-4 py-2.5 text-neutral-700 hover:text-blue-600 font-bold text-sm transition-colors cursor-pointer"
            >
              Acessar Painel
            </button>

            <button
              onClick={handleDiagnostic}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* HERO SECTION */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-blue-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Aulas Particulares 1:1 Ao Vivo</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="text-neutral-600">Sem Contratos de 12 Meses</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-950 tracking-tight leading-[1.1]">
                Fale inglês com naturalidade.{' '}
                <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent">
                  Aprenda com quem entende seu ritmo.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                A Talkê conecta você a professores dedicados em uma sala virtual moderna com quadro digital, materiais sob medida e o exclusivo acompanhamento contínuo de <strong>onde você parou</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleDiagnostic}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Agendar Aula Experimental</span>
                </button>

                <button
                  onClick={handleExplore}
                  className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Ver Nossos Professores</span>
                </button>
              </div>

              {/* Social Proof metrics */}
              <div className="pt-6 border-t border-neutral-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-neutral-900">+5.200</div>
                  <div className="text-xs text-neutral-500 font-medium">Aulas Realizadas</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center gap-1 justify-center lg:justify-start">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>4.93</span>
                  </div>
                  <div className="text-xs text-neutral-500 font-medium">Avaliação Média</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600">100%</div>
                  <div className="text-xs text-neutral-500 font-medium">Professores Certificados</div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Platform Card Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative glow behind */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-3xl blur-xl opacity-30 animate-pulse" />

                {/* Main Mockup Box: The Talkê Virtual Classroom & Onde Parei */}
                <div className="relative bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-400 ml-2 font-mono">talke.com.br/classroom</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      Ao Vivo HD
                    </span>
                  </div>

                  {/* Simulated Classroom Screen */}
                  <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 aspect-video flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                        Slide 3: Business Pitch & Meeting Fluency
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">42:15</span>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="text-sm sm:text-base font-bold text-slate-100">
                        "Could you elaborate on the roadmap milestones?"
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Prática de perguntas estratégicas em alinhamento de projetos
                      </p>
                    </div>

                    {/* PiP simulated teacher video */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs text-slate-300">
                        <Video className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Prof. Sarah Jenkins (Cambridge TESOL)</span>
                      </div>

                      <div className="w-16 h-12 rounded-xl bg-blue-900 border border-cyan-400/40 overflow-hidden shadow-md flex items-center justify-center text-[10px] text-cyan-200 font-bold">
                        Você (Aluno)
                      </div>
                    </div>
                  </div>

                  {/* Feature Pill 1: Onde Parei */}
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-white block">Registro Inteligente "Onde Parei":</span>
                      <span className="text-slate-300 text-[11px]">
                        Seu progresso é gravado. Você nunca repete conteúdo nem perde o fio da meada.
                      </span>
                    </div>
                  </div>

                  {/* Feature Pill 2: Repasse Justo */}
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-white block">85% de Repasse Líquido aos Professores:</span>
                      <span className="text-slate-300 text-[11px]">
                        Professores motivados e bem remunerados entregam aulas muito melhores.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COMO FUNCIONA (4 STEPS) */}
      {/* ===================================================================== */}
      <section id="como-funciona" className="py-20 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Passo a Passo Simples
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Como funciona aprender inglês na Talkê
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Do diagnóstico ao destrave da fala: um processo claro, sem burocracia e totalmente centrado nos seus objetivos pessoais ou profissionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                  1
                </div>
                <h3 className="text-lg font-black text-neutral-900">Diagnóstico de Nível</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Avaliação guiada de nível CEFR (do A1 ao C2) e definição das suas metas (viagens, carreira, conversação ou exames).
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 text-xs font-bold text-blue-600 flex items-center gap-1">
                <span>Rápido e 100% gratuito</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                  2
                </div>
                <h3 className="text-lg font-black text-neutral-900">Matching de Afinidade</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Nosso algoritmo analisa seu perfil e sugere os professores ideais para o seu sotaque preferido, especialidade e horários livres.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 text-xs font-bold text-sky-600 flex items-center gap-1">
                <span>Horários flexíveis 7 dias/semana</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                  3
                </div>
                <h3 className="text-lg font-black text-neutral-900">Aula Ao Vivo na Sala Talkê</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Ambiente imersivo com vídeo HD, quadro branco interativo, compartilhamento de tela e material de apoio estruturado.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 text-xs font-bold text-cyan-600 flex items-center gap-1">
                <span>Sem precisar instalar nada</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                  4
                </div>
                <h3 className="text-lg font-black text-neutral-900">Registro "Onde Parei"</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  O professor registra a lição exata, feedback de pronúncia e lição de casa. Você continua exatamente de onde parou.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span>Evolução contínua em nuvem</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* METODOLOGIA & NÍVEIS TALKÊ (BÁSICO, INTERMEDIÁRIO, AVANÇADO) */}
      {/* ===================================================================== */}
      <section id="metodologia" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-700 bg-cyan-100/60 px-3 py-1 rounded-full border border-cyan-200">
              Grade Didática Estruturada
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Metodologia prática dividida em 3 grandes níveis
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Esqueça listas de verbos soltas. Na Talkê você aprende estruturas aplicadas a situações reais de vida e trabalho.
            </p>
          </div>

          {/* Level Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 bg-neutral-200/80 rounded-2xl">
              <button
                onClick={() => setActiveLevelTab('basico')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeLevelTab === 'basico'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Módulo Básico (A1 - A2)
              </button>

              <button
                onClick={() => setActiveLevelTab('intermediario')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeLevelTab === 'intermediario'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Módulo Intermediário (B1 - B2)
              </button>

              <button
                onClick={() => setActiveLevelTab('avancado')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeLevelTab === 'avancado'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Módulo Avançado (C1 - C2)
              </button>
            </div>
          </div>

          {/* Active Level Content Card */}
          <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
            {activeLevelTab === 'basico' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    Destrave Inicial & Comunicação do Dia a Dia
                  </span>
                  <h3 className="text-2xl font-black text-neutral-900">
                    Básico: Perca o medo de falar e domine situações reais
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Ideal para quem está começando do zero ou já estudou inglês no passado mas sempre trava na hora de abrir a boca. Você aprende a se apresentar, pedir informações, viajar com segurança e falar da sua rotina sem depender de tradução mental.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Apresentações pessoais naturais e quebra-gelo</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Sobrevivência em viagens: aeroportos, alfândega, hotéis e restaurantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Estruturas essenciais de presente, passado e planos futuros</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                  <span className="text-xs text-cyan-400 font-bold uppercase">Unidades em Destaque:</span>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 1: Primeiras Conversas & Apresentação</div>
                      <div className="text-xs text-slate-400 mt-0.5">Frases-chave para nunca mais dizer "My name is" de forma robótica.</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 3: Viagens, Aeroporto & Sobrevivência</div>
                      <div className="text-xs text-slate-400 mt-0.5">Roleplay de imigração, pedidos de bagagem e check-in sem sufoco.</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 4: Contando Histórias do Passado</div>
                      <div className="text-xs text-slate-400 mt-0.5">Fale sobre seu último fim de semana ou férias de forma fluida.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeLevelTab === 'intermediario' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-md">
                    Inglês Profissional & Fluência Espontânea
                  </span>
                  <h3 className="text-2xl font-black text-neutral-900">
                    Intermediário: Reuniões, apresentações e entrevistas de emprego
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Você já entende boa parte do que ouve, mas ainda hesita na hora de argumentar em reuniões com colegas estrangeiros. Nosso foco é eliminar o "portuglish", enriquecer vocabulário executivo e dar agilidade mental na conversação.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Condução de reuniões, alinhamento de prazos e feedbacks</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Simulações de entrevistas de emprego com perguntas comportamentais</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Expressões idiomáticas de negócios e phrasal verbs corporativos</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                  <span className="text-xs text-cyan-400 font-bold uppercase">Unidades em Destaque:</span>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 1: Reuniões & Small Talk Corporativo</div>
                      <div className="text-xs text-slate-400 mt-0.5">Como iniciar reuniões com gringos e transitar para os tópicos de negócios.</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 2: Apresentando Projetos & Pitching</div>
                      <div className="text-xs text-slate-400 mt-0.5">Narrativa executiva, explicação de métricas e respostas sob pressão.</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 3: Entrevistas de Emprego em Inglês</div>
                      <div className="text-xs text-slate-400 mt-0.5">Método STAR aplicado para responder perguntas sobre desafios e conquistas.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeLevelTab === 'avancado' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    Nuances Globais & Negociações de Alto Impacto
                  </span>
                  <h3 className="text-2xl font-black text-neutral-900">
                    Avançado: Sofisticação de vocabulário e persuasão
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Para líderes, executivos e profissionais que já falam fluentemente mas desejam refinar sotaque, dominar diplomacia corporativa, negociações sensíveis e debates de alta complexidade.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Negociações bilaterais de contratos e acordos</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Comunicação assertiva sem soar agressivo</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Redução de sotaque e fluência nativa refinada</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                  <span className="text-xs text-cyan-400 font-bold uppercase">Unidades em Destaque:</span>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 1: Negociações Complexas & Persuasão</div>
                      <div className="text-xs text-slate-400 mt-0.5">Técnicas de concessão, linguagem de influência e fechamento.</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 2: Debates de Tópicos Globais & Ética</div>
                      <div className="text-xs text-slate-400 mt-0.5">Argumentação fundamentada sobre geopolítica, tecnologia e liderança.</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="font-bold text-sm">Unidade 3: Nuances Culturais & Diplomacia</div>
                      <div className="text-xs text-slate-400 mt-0.5">Diferenças sutis entre comunicação americana, britânica e asiática.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* DIFERENCIAIS: COMPARATIVO LADO A LADO */}
      {/* ===================================================================== */}
      <section id="diferenciais" className="py-20 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Comparativo Transparente
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Por que a Talkê é diferente de tudo que você já viu
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Veja a diferença entre nosso modelo individual sob demanda e as escolas tradicionais de inglês.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-200">
                  <th className="py-4 px-4 font-bold text-neutral-500 uppercase text-xs">Critério</th>
                  <th className="py-4 px-6 font-black text-blue-700 bg-blue-50/60 rounded-t-2xl text-base">
                    Plataforma Talkê
                  </th>
                  <th className="py-4 px-6 font-bold text-neutral-700">Escolas Tradicionais</th>
                  <th className="py-4 px-6 font-bold text-neutral-700">Aplicativos com IA / Robô</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="py-4 px-4 font-bold text-neutral-800">Atenção do Professor</td>
                  <td className="py-4 px-6 font-bold text-blue-700 bg-blue-50/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100% Individual (1 para 1)</span>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">Turmas de 8 a 15 alunos</td>
                  <td className="py-4 px-6 text-neutral-600">Sem professor humano</td>
                </tr>

                <tr>
                  <td className="py-4 px-4 font-bold text-neutral-800">Contratos & Fidelidade</td>
                  <td className="py-4 px-6 font-bold text-blue-700 bg-blue-50/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Zero fidelidade. Aulas avulsas ou créditos</span>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">Fidelidade de 12 a 24 meses</td>
                  <td className="py-4 px-6 text-neutral-600">Assinatura mensal recorrente</td>
                </tr>

                <tr>
                  <td className="py-4 px-4 font-bold text-neutral-800">Continuidade Pedagógica</td>
                  <td className="py-4 px-6 font-bold text-blue-700 bg-blue-50/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Registro em nuvem "Onde Parei"</span>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">Se faltar uma aula, perdeu a matéria</td>
                  <td className="py-4 px-6 text-neutral-600">Sem contextualização humana</td>
                </tr>

                <tr>
                  <td className="py-4 px-4 font-bold text-neutral-800">Repasse para os Professores</td>
                  <td className="py-4 px-6 font-bold text-blue-700 bg-blue-50/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>85% líquido para o professor</span>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">Apenas 15% a 25% da mensalidade</td>
                  <td className="py-4 px-6 text-neutral-600">Não remunera professores</td>
                </tr>

                <tr>
                  <td className="py-4 px-4 font-bold text-neutral-800">Flexibilidade de Horários</td>
                  <td className="py-4 px-6 font-bold text-blue-700 bg-blue-50/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Das 6h às 23h, 7 dias por semana</span>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">Horários fixos inflexíveis</td>
                  <td className="py-4 px-6 text-neutral-600">24/7 (porém sem aula humana)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SOBRE NÓS (NOSSA HISTÓRIA & MISSÃO) */}
      {/* ===================================================================== */}
      <section id="sobre-nos" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Nossa História & Missão
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
                A Talkê nasceu para libertar os brasileiros do bloqueio na hora de falar inglês.
              </h2>

              <p className="text-base text-neutral-600 leading-relaxed">
                Mais de 95% dos brasileiros que entram em escolas tradicionais de idiomas desistem antes de atingir a fluência. O motivo? Anos de gramática repetitiva, turmas lotadas onde você mal fala 3 minutos por aula e contratos leoninos que te prendem por anos.
              </p>

              <p className="text-base text-neutral-600 leading-relaxed">
                Na Talkê, acreditamos que <strong>conversação real com atenção individual</strong> é o único caminho seguro para a fluência. Criamos uma plataforma justa tanto para o aluno (que paga por aula com total transparência) quanto para os professores (que recebem 85% do valor, o maior repasse do mercado).
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
                  <div className="font-black text-2xl text-blue-600">85%</div>
                  <div className="text-xs text-neutral-500 font-bold mt-1">Repasse Justo</div>
                  <p className="text-[11px] text-neutral-400 mt-1">Valorizamos nossos educadores parceiros.</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
                  <div className="font-black text-2xl text-emerald-600">Zero</div>
                  <div className="text-xs text-neutral-500 font-bold mt-1">Pegadinhas ou Multas</div>
                  <p className="text-[11px] text-neutral-400 mt-1">Você é livre para estudar quando quiser.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="bg-gradient-to-br from-[#1B3654] via-[#214368] to-[#18314E] text-white rounded-3xl p-8 shadow-lg border border-blue-200/20 space-y-6">
                <div className="flex items-center gap-3">
                  <TalkeLogo size="sm" variant="card" />
                  <div>
                    <h3 className="font-black text-lg text-white">Os 3 Pilares Talkê</h3>
                    <span className="text-xs text-blue-200">Nossa promessa irrevogável</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-start gap-3">
                    <span className="font-black text-cyan-400 text-base">01.</span>
                    <div>
                      <strong className="text-white block font-bold">Foco em Conversação desde o Minuto 1:</strong>
                      Gramática existe para apoiar a comunicação, e não o contrário.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-cyan-400 text-base">02.</span>
                    <div>
                      <strong className="text-white block font-bold">Respeito ao seu Tempo e Bolso:</strong>
                      Sem mensalidades presas quando você viaja a trabalho ou está de férias.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-cyan-400 text-base">03.</span>
                    <div>
                      <strong className="text-white block font-bold">Continuidade Verdadeira:</strong>
                      Seu aprendizado é cumulativo e rastreado em detalhes a cada sessão.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PROFESSORES EM DESTAQUE */}
      {/* ===================================================================== */}
      <section id="professores" className="py-20 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Professores Credenciados
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Conheça alguns dos nossos especialistas
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Todos os professores passam por entrevista pedagógica, teste de fluência avançada e verificação rigorosa de antecedentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Teacher 1 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                    alt="Sarah Jenkins"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-600/30"
                  />
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">Sarah Jenkins</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>5.0 (42 avaliações)</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">Cambridge CELTA • Sotaque Britânico</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  "Especialista em destravar executivos de TI e finanças para reuniões com stakeholders internacionais."
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">Business English</span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">Entrevistas</span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">Avançado</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Valor / hora</span>
                  <span className="text-base font-black text-neutral-900">R$ 75,00</span>
                </div>
                <button
                  onClick={onSelectTeacherDirectly}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Agendar Aula
                </button>
              </div>
            </div>

            {/* Teacher 2 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
                    alt="Carlos Mendoza"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-600/30"
                  />
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">Carlos Mendoza</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>4.9 (58 avaliações)</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">TESOL Certified • American Accent</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  "Foco em destrave inicial para quem tem vergonha de falar e preparação rápida para viagens ao exterior."
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">Iniciantes</span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">Viagens</span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">Dia a Dia</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Valor / hora</span>
                  <span className="text-base font-black text-neutral-900">R$ 60,00</span>
                </div>
                <button
                  onClick={onSelectTeacherDirectly}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Agendar Aula
                </button>
              </div>
            </div>

            {/* Teacher 3 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-neutral-200 flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
                    alt="Juliana Duarte"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-600/30"
                  />
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">Juliana Duarte</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>4.9 (73 avaliações)</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">Linguística USP • 8 anos nos EUA</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed italic">
                  "Método focado em fonética aplicada, eliminação de sotaque pesado e conversação espontânea sobre cultura pop."
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">Pronúncia</span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">Intermediário</span>
                  <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">Fluência</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Valor / hora</span>
                  <span className="text-base font-black text-neutral-900">R$ 65,00</span>
                </div>
                <button
                  onClick={onSelectTeacherDirectly}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Agendar Aula
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PREÇOS & PLANOS */}
      {/* ===================================================================== */}
      <section id="precos" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Sem Pegadinhas
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Preços transparentes que cabem no seu planejamento
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Você pode pagar por aula avulsa ou economizar com pacotes flexíveis de créditos que nunca expiram em menos de 1 ano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1 */}
            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wide text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                  Flexibilidade Total
                </span>
                <h3 className="text-2xl font-black text-neutral-900">Aula Avulsa</h3>
                <p className="text-xs text-neutral-500">
                  Ideal para testar a metodologia ou resolver uma dúvida urgente antes de uma entrevista.
                </p>

                <div className="pt-2">
                  <span className="text-3xl font-black text-neutral-950">R$ 65</span>
                  <span className="text-xs text-neutral-500 font-medium"> / por aula</span>
                </div>

                <ul className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1 aula particular de 50 minutos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Acesso completo à sala virtual</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registro "Onde Parei"</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleDiagnostic}
                className="mt-8 w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Agendar Aula Avulsa
              </button>
            </div>

            {/* Plan 2: Most Popular */}
            <div className="bg-gradient-to-b from-[#1B3654] via-[#214368] to-[#18314E] text-white rounded-3xl p-8 shadow-xl border-2 border-blue-400 relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-200 via-sky-100 to-blue-200 text-slate-900 font-black text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                Mais Escolhido • Pacote Destrave
              </div>

              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wide text-blue-200 bg-blue-500/20 px-2.5 py-1 rounded-md">
                  8 Aulas de 50 min
                </span>
                <h3 className="text-2xl font-black text-white">Pacote Fluência</h3>
                <p className="text-xs text-slate-300">
                  Ritmo ideal de 2 aulas por semana durante 1 mês para destravar a fala de vez.
                </p>

                <div className="pt-2">
                  <span className="text-3xl font-black text-white">R$ 55</span>
                  <span className="text-xs text-slate-300 font-medium"> / aula (R$ 440 total)</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-300" />
                    <span>8 aulas particulares ao vivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-300" />
                    <span>Economia de R$ 80 comparado à avulsa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-300" />
                    <span>Créditos válidos por 12 meses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-300" />
                    <span>Acesso ao Laboratório Interativo</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleDiagnostic}
                className="mt-8 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/40 transition-all cursor-pointer"
              >
                Garantir Pacote Fluência
              </button>
            </div>

            {/* Plan 3 */}
            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wide text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                  Imersão Executiva
                </span>
                <h3 className="text-2xl font-black text-neutral-900">Pacote Imersão</h3>
                <p className="text-xs text-neutral-500">
                  Para quem precisa de preparação rápida para promoção internacional ou intercâmbio.
                </p>

                <div className="pt-2">
                  <span className="text-3xl font-black text-neutral-950">R$ 50</span>
                  <span className="text-xs text-neutral-500 font-medium"> / aula (R$ 800 total)</span>
                </div>

                <ul className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-neutral-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>16 aulas particulares ao vivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Menor valor por hora (R$ 50/aula)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Simulações ilimitadas de entrevista</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleDiagnostic}
                className="mt-8 w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Garantir Pacote Imersão
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FAQ ACCORDION */}
      {/* ===================================================================== */}
      <section id="faq" className="py-20 bg-white border-y border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Perguntas Frequentes (FAQ)
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed">
              Tudo o que você precisa saber sobre a experiência Talkê antes de agendar sua primeira aula.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl border border-neutral-200 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-neutral-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-200/60 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CONTATO & SUPORTE */}
      {/* ===================================================================== */}
      <section id="contato" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Contact details */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Fale Conosco
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
                Estamos prontos para te ajudar a destravar seu inglês.
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Tem dúvidas sobre nosso método, deseja contratar planos para sua empresa ou é professor interessado em dar aulas na Talkê? Entre em contato pelos canais oficiais.
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-neutral-200">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">WhatsApp de Atendimento:</span>
                    <span className="text-neutral-500 font-medium">+55 (11) 98765-4321</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-neutral-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">E-mail Institucional:</span>
                    <span className="text-neutral-500 font-medium">contato@talke.com.br</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-neutral-200">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">Horário de Suporte Humano:</span>
                    <span className="text-neutral-500 font-medium">Segunda a Sábado, das 8h às 20h (Horário de Brasília)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
              <h3 className="text-xl font-black text-neutral-900 mb-2">Envie uma Mensagem</h3>
              <p className="text-xs text-neutral-500 mb-6">
                Preencha o formulário abaixo e nossa equipe pedagógica retornará em menos de 2 horas úteis.
              </p>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-900">Mensagem Enviada com Sucesso!</h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Obrigado, <strong>{contactName}</strong>. Recebemos seus dados e entraremos em contato através do e-mail <strong>{contactEmail}</strong> ou WhatsApp.
                  </p>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactMessage('');
                    }}
                    className="mt-2 text-xs font-bold text-emerald-700 underline"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Seu Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ex: Ana Clara Ribeiro"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Seu Melhor E-mail *</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Ex: ana@exemplo.com.br"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">WhatsApp / Telefone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">Assunto</label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                      >
                        <option value="Dúvidas sobre Aulas">Dúvidas sobre Aulas Particulares</option>
                        <option value="Pacotes para Empresas">Planos para Empresas (B2B)</option>
                        <option value="Quero ser Professor">Quero ser Professor Credenciado</option>
                        <option value="Outros Assuntos">Outros Assuntos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Como podemos te ajudar? *</label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Conte um pouco sobre seu objetivo com o inglês ou tire suas dúvidas..."
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Mensagem para a Equipe Talkê</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FOOTER */}
      {/* ===================================================================== */}
      <footer className="bg-slate-950 text-slate-400 text-xs pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <TalkeLogo size="md" />
              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                Talkê é a plataforma de aulas particulares de inglês ao vivo focada em conversação prática, professores valorizados e transparência total.
              </p>
              <div className="text-[11px] text-slate-500">
                CNPJ: 42.123.456/0001-78 • São Paulo - SP
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Plataforma</h4>
              <ul className="space-y-1.5">
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#metodologia" className="hover:text-white transition-colors">Grade Curricular</a></li>
                <li><a href="#professores" className="hover:text-white transition-colors">Professores Verificados</a></li>
                <li><a href="#precos" className="hover:text-white transition-colors">Planos & Preços</a></li>
                <li><button onClick={onOpenDiagnostic} className="hover:text-white transition-colors text-left">Diagnóstico Gratuito</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Institucional</h4>
              <ul className="space-y-1.5">
                <li><a href="#sobre-nos" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
                <li><button onClick={() => handleEnter()} className="hover:text-cyan-400 transition-colors font-bold">Painel do Aluno / Professor</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Segurança & Garantia</h4>
              <p className="text-xs text-slate-400">
                Pagamentos 100% seguros com proteção de escrow e garantia de devolução de créditos em caso de imprevisto.
              </p>
              <div className="pt-2 flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Ambiente Seguro SSL 256-bit</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              © {new Date().getFullYear()} Talkê Idiomas Ltda. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-300 cursor-pointer">Termos de Uso</span>
              <span className="hover:text-slate-300 cursor-pointer">Política de Privacidade</span>
              <span className="hover:text-slate-300 cursor-pointer">Diretrizes da Comunidade</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
