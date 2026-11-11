import React from 'react';
import { SupportContacts } from './SupportContacts';
export function PrivacyNotice({ config, terms = false }: { config: any; terms?: boolean }) {
  return (
    <article className="card space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">{terms ? 'Termos de uso' : 'Privacidade e seus dados'}</h1>
      <p>
        Versão {config.termsVersion}. Controlador: {config.legalName || 'Ainda não configurado'} ·
        CNPJ {config.legalCnpj || 'pendente'}.
      </p>
      {!config.legalApproved && (
        <p>
          Ambiente em preparação. A publicação comercial exige aprovação dos documentos e canais de
          atendimento.
        </p>
      )}
      {terms ? (
        <>
          <p>
            A Talkê oferece reservas e aulas de inglês de 50 minutos, no horário de Brasília. O
            catálogo de planos informa o preço mensal e a quantidade de aulas.
          </p>
          <p>
            Os planos mensais permitem professores diferentes e renovam automaticamente no cartão
            todo mês até cancelar a renovação. Aulas não usadas acumulam por mais um ciclo mensal,
            respeitando a validade mostrada na conta.
          </p>
          <p>
            O pagamento da assinatura ocorre na página hospedada do Asaas. As aulas são liberadas
            após confirmação consultada pelo servidor. O retorno da página de pagamento não comprova
            a cobrança.
          </p>
          <p>
            Você pode solicitar o cancelamento da renovação na área Planos. Cobranças já emitidas,
            reembolsos e problemas com aulas exigem acompanhamento pelo atendimento.
          </p>
          {config.subscriptionsEnabled && (
            <p>
              {config.subscriptionCancelCredits === '60_days_after_cancel'
                ? 'Após cancelar a renovação, você tem 60 dias para realizar as aulas já pagas e ainda válidas. A conta mostra a data limite; aulas vencidas ou estornadas não são recuperadas.'
                : config.subscriptionCancelCredits === 'keep_until_expiry'
                  ? 'Após cancelar a renovação, as aulas já pagas continuam disponíveis até sua validade.'
                  : 'Após cancelar a renovação, novas reservas com o plano ficam bloqueadas. O suporte acompanha o saldo de aulas.'}
            </p>
          )}
          <p>
            O professor conclui a aula e o aluno adulto ou responsável confirma que ela ocorreu.
            Havendo discordância, use “Relatar problema” e procure o suporte antes de confirmar.
          </p>
          {config.paymentsEnabled && (
            <>
              <p>
                A reserva aguarda pagamento por até 30 minutos. O servidor confirma o pagamento após
                consultar o Mercado Pago. O retorno do checkout não confirma pagamento.
              </p>
              <p>
                O Checkout Pro é operado pelo Mercado Pago. A comissão Talkê é de 15% do preço da
                aula. As tarifas do Mercado Pago são adicionais e descontadas da parcela do
                professor. Disponibilidade e retiradas dependem das condições do provedor.
              </p>
              <p>
                Você pode cancelar antes de iniciar a aula. Quando houver pagamento, o reembolso é
                solicitado e acompanhado até a confirmação. Problemas durante ou após a aula exigem
                atendimento. Seus direitos previstos no Código de Defesa do Consumidor permanecem
                aplicáveis, inclusive o arrependimento quando cabível.
              </p>
            </>
          )}
          <p>
            Menores são cadastrados pelo responsável adulto e só podem reservar após aprovação do
            vínculo. Professores precisam de aprovação administrativa e cadastro financeiro
            verificado para a modalidade de pagamento.
          </p>
          <p>
            {config.videoProvider === 'google_meet' &&
              'No Google Meet, o professor deve usar uma reunião exclusiva por aula, admitir somente os participantes previstos, não gravar a chamada e encerrá-la para todos ao terminar. '}
            Assédio, discriminação, exposição de dados e contato inadequado com menores são
            proibidos. Use “Relatar problema” na aula. A administração pode suspender acesso para
            apurar fatos e proteger participantes.
          </p>
          <p>
            A sala de vídeo é privada e temporária. A plataforma não oferece gravação automática.
            Não grave nem divulgue imagens ou conteúdo dos participantes sem autorização adequada.
          </p>
        </>
      ) : (
        <>
          <p>
            Coletamos nome, e-mail verificado, nascimento, tipo de conta, vínculo com responsável,
            objetivos de aprendizagem, reservas, avaliações e registros pedagógicos. Professores
            fornecem perfil profissional, disponibilidade, preço e autorização de conexão Mercado
            Pago quando houver aulas avulsas, além do vínculo financeiro com Asaas para os planos.
          </p>
          <p>
            Usamos os dados para autenticar, prestar aulas, gerir pagamentos, prevenir fraude,
            proteger menores e atender solicitações. O aceite dos termos registra a contratação. As
            bases legais de cada tratamento devem constar no registro do controlador. Autorizações
            do responsável são registradas separadamente e avaliadas considerando o melhor interesse
            do menor.
          </p>
          <p>
            O Firebase processa autenticação e armazenamento; o Asaas processa as assinaturas e
            repasses; o Mercado Pago atende aulas avulsas quando habilitadas; a AWS hospeda a
            aplicação.{' '}
            {config.videoProvider === 'google_meet'
              ? 'As chamadas são realizadas no Google Meet, em outra aba, sob os controles do organizador. O encerramento e a admissão dos participantes são feitos pelo professor; bloquear o link na Talkê não revoga links já copiados.'
              : 'O Daily fornece vídeo integrado.'}{' '}
            A Talkê não solicita número completo de cartão ou código de segurança.
          </p>
          <p>
            O catálogo publica apenas o perfil profissional aprovado. Dados de alunos e responsáveis
            não são públicos. Professores acessam informações necessárias às suas próprias aulas.
            Não ativamos publicidade comportamental ou análise opcional.
          </p>
          <p>
            Você pode exportar dados e solicitar acesso, correção, exclusão, oposição ou retirada de
            autorização. O responsável pode agir pelo dependente. Pedidos recebem protocolo e
            análise. Registros financeiros e de defesa de direitos podem precisar ser mantidos, com
            acesso restrito e justificativa.
          </p>
          <p>
            A exclusão exige resolver aulas, pagamentos e vínculos em aberto. O controlador deve
            informar prazos e justificativas de retenção, inclusive dos backups, e esclarecer
            transferências internacionais e suas salvaguardas. Consulte o canal de privacidade.
          </p>
          <p>
            O login usa armazenamento necessário à sessão. Rastreamento opcional está desativado; a
            inclusão de novas finalidades exige informação e configuração adequada.
          </p>
        </>
      )}
      <p>
        Privacidade:{' '}
        {config.privacyEmail ? (
          <a href={'mailto:' + config.privacyEmail}>{config.privacyEmail}</a>
        ) : (
          'canal pendente'
        )}
        . Atendimento: <SupportContacts config={config} />.
      </p>
      <p>
        Para crianças: seu responsável cuida do cadastro. Seu professor vê informações para ajudar
        você a aprender. Se algo incomodar, saia da sala e conte ao responsável. Vocês podem pedir
        ajuda e informações sobre seus dados.
      </p>
    </article>
  );
}
