export function SchoolOverview({ minorsEnabled }: { minorsEnabled: boolean }) {
  return (
    <section className="card mb-6 space-y-5" aria-label="Conheça a Talkê">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-blue-900">Seu inglês. Seus objetivos.</h1>
        <p>
          Aulas particulares e 100% online, com conteúdo conectado à sua rotina, ao seu nível e aos
          seus interesses.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <h2 className="font-bold">Material personalizado</h2>
          <p>Vocabulário, diálogos, leitura, listening e revisões para situações da sua vida.</p>
        </div>
        <div>
          <h2 className="font-bold">Conversação e prática</h2>
          <p>Inglês para viagens, trabalho, vida no exterior e conversas do cotidiano.</p>
        </div>
        <div>
          <h2 className="font-bold">Acompanhamento individual</h2>
          <p>Objetivos, feedback e ajustes no percurso de aprendizagem.</p>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Aula experimental gratuita</h2>
        <p>
          Conheça a dinâmica das aulas e converse sobre seus objetivos. O agendamento e a
          disponibilidade de horários são confirmados pelo atendimento.
        </p>
        <a
          className="inline-block rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
          href="https://wa.me/5511965802237"
          target="_blank"
          rel="noopener noreferrer"
        >
          Agendar aula experimental pelo WhatsApp
        </a>
        <p className="text-sm text-slate-600">
          WhatsApp: (11) 96580-2237 · Contato adicional:{' '}
          <a href="tel:+5511916551833">(11) 91655-1833</a>
        </p>
      </div>
      <p className="text-sm text-slate-600">
        {minorsEnabled
          ? 'Aulas para crianças e adolescentes exigem cadastro de um responsável e aprovação do vínculo na plataforma.'
          : 'Para informações sobre aulas para crianças e adolescentes, fale com o atendimento. O cadastro de menores na plataforma aguarda liberação.'}
      </p>
    </section>
  );
}
