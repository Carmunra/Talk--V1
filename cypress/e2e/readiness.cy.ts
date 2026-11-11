/// <reference types="cypress" />
const password = 'Local-test-password-123!';
function token(uid: string) {
  return cy
    .request(
      'POST',
      'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
      { email: uid + '@example.test', password, returnSecureToken: true },
    )
    .then((response) => response.body.idToken as string);
}
function login(uid: string) {
  cy.intercept('POST', '**/accounts:signInWithPassword*').as('signIn');
  cy.intercept('GET', '/api/me').as('sessionProfile');
  if (uid === 'student' || uid === 'other')
    cy.intercept('GET', '/api/students/' + uid).as('currentStudent');
  cy.visit('/');
  cy.get('[aria-label="E-mail de teste"]').type(uid + '@example.test');
  cy.get('[aria-label="Senha de teste"]').type(password, { log: false });
  cy.contains('button', 'Entrar no emulador').click();
  cy.wait('@signIn', { requestTimeout: 30000, responseTimeout: 30000 })
    .its('response.statusCode')
    .should('eq', 200);
  cy.wait('@sessionProfile', { requestTimeout: 30000, responseTimeout: 30000 })
    .its('response.body.profile.id')
    .should('eq', uid);
  cy.contains('button', 'Minhas aulas').should('be.visible');
  cy.contains('button', 'Início').click();
  cy.get('section[aria-label="Resumo da sua conta"]').should('be.visible');
  cy.get('nav[aria-label="Outras áreas da conta"]').then((nav) => {
    if (!nav.is(':visible')) cy.contains('summary', 'Mais opções').click();
  });
  cy.contains('button', 'Professores').click();
  if (uid === 'student' || uid === 'other') {
    cy.wait('@currentStudent');
    cy.contains('Descubra seu Nível').should('be.visible');
  }
}
describe('Fluxos comerciais protegidos com Auth emulator e gateway de teste', () => {
  beforeEach(() => {
    cy.request({ method: 'POST', url: '/_test/reset', headers: { 'x-test-key': 'local-e2e' } });
  });
  it('contrata pela interface, exige aceite e retoma apenas o checkout do próprio pagador', () => {
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/enable',
      headers: { 'x-test-key': 'local-e2e' },
    });
    login('student');
    cy.contains('button', 'Planos').click();
    cy.contains('button', 'Selecionar Essencial').click();
    cy.get('[role="dialog"]')
      .should('contain.text', 'R$\u00a0439,00')
      .and('contain.text', 'renova automaticamente');
    cy.contains('button', 'Preparar pagamento').should('be.disabled');
    cy.get('[role="dialog"] input[type="checkbox"]').check();
    cy.intercept('POST', '/api/subscriptions/checkout').as('monthlyPurchase');
    cy.contains('button', 'Preparar pagamento').click();
    cy.wait('@monthlyPurchase').its('response.statusCode').should('eq', 200);
    cy.get('[role="dialog"] a')
      .filter('[href^="https://sandbox.asaas.com/checkoutSession/show?id="]')
      .should('have.length', 1);
    cy.get('[aria-label="Fechar contratação"]').click();
    cy.contains('button', 'Selecionar Essencial').should('be.disabled');
    cy.get('section[aria-label="Minha assinatura"]').should(
      'contain.text',
      'pagamento em acompanhamento',
    );
    cy.contains('button', 'Sair').click();
    cy.contains('button', 'Entrar com Google').should('be.visible');
    cy.contains('A contratação dos planos ainda não está disponível.').should('not.exist');
    login('other');
    cy.contains('button', 'Planos').click();
    cy.contains('Você ainda não tem uma assinatura para este aluno.').should('be.visible');
    cy.contains('a', 'Continuar pagamento no Asaas').should('not.exist');
  });
  it('mostra saldo e cobranças e cancela a renovação com confirmação e foco acessível', () => {
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/seed',
      headers: { 'x-test-key': 'local-e2e' },
    });
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/enable',
      headers: { 'x-test-key': 'local-e2e' },
    });
    login('student');
    cy.contains('button', 'Planos').click();
    cy.contains('4 aulas disponíveis').should('be.visible');
    cy.contains('summary', 'Cobranças da assinatura').click();
    cy.contains('td', 'Pagamento recebido').should('be.visible');
    cy.contains('button', 'Cancelar renovação').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain.text', '60 dias após o cancelamento');
    cy.focused().should('contain.text', 'Manter assinatura').trigger('keydown', { key: 'Escape' });
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('button', 'Cancelar renovação').should('have.focus').click();
    cy.contains('button', 'Confirmar cancelamento da renovação').click();
    cy.contains('Renovação cancelada').should('be.visible');
    cy.contains('4 aulas disponíveis').should('be.visible');
    cy.contains('Você tem 60 dias desde o cancelamento').should('be.visible');
    cy.contains('Realize-as antes de').should('be.visible');
  });
  it('reserva com saldo na interface e pede confirmação do aluno antes do repasse', () => {
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/seed',
      headers: { 'x-test-key': 'local-e2e' },
    }).then(({ body }) => {
      cy.wrap(body.booking.scheduledDate).as('planDate');
    });
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/enable',
      headers: { 'x-test-key': 'local-e2e' },
    });
    login('student');
    cy.contains('button', 'Agendar').first().click();
    cy.get('@planDate').then((value) => {
      const label = new Date(String(value) + 'T12:00:00Z').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      cy.contains('button', label).click();
    });
    cy.contains('button', '10:00').click();
    cy.contains('1 aula do seu saldo').should('be.visible');
    cy.contains('button', 'Reservar com meu plano').click();
    cy.contains('Aula do plano').should('be.visible');
    cy.contains('button', 'Pagar no Mercado Pago').should('not.exist');
    token('student')
      .then((bearer) =>
        cy.request({ url: '/api/lessons', headers: { Authorization: 'Bearer ' + bearer } }),
      )
      .then(({ body }) => {
        const lesson = body[0];
        cy.request({
          method: 'POST',
          url: '/_test/subscriptions/finish/' + lesson.id,
          headers: { 'x-test-key': 'local-e2e' },
        });
        token('teacher').then((bearer) =>
          cy.request({
            method: 'POST',
            url: '/api/lessons/' + lesson.id + '/complete',
            headers: { Authorization: 'Bearer ' + bearer },
            body: {},
          }),
        );
      });
    cy.contains('button', 'Atualizar status').click();
    cy.contains('button', 'Confirmar que a aula ocorreu').click();
    cy.contains('Realização confirmada pelo aluno ou responsável.').should('be.visible');
    cy.request({ url: '/_test/subscriptions/status', headers: { 'x-test-key': 'local-e2e' } }).then(
      ({ body }) => {
        expect(body.calls).to.eq(1);
        expect(body.transfers[0].value).to.eq(40);
      },
    );
    cy.contains('button', 'Planos').click();
    cy.contains('3 aulas disponíveis').should('be.visible');
  });
  it('exibe os cinco planos públicos com preços mensais e contratação indisponível', () => {
    cy.visit('/planos');
    cy.get('h1').should('have.text', 'Planos mensais');
    const plans = [
      [4, '439'],
      [6, '569'],
      [8, '709'],
      [12, '969'],
      [16, '1.239'],
    ];
    for (const [lessons, amount] of plans) {
      cy.get(`article[aria-label="${lessons} aulas por mês"]`)
        .should('contain.text', `${lessons} aulas`)
        .and('contain.text', `R$\u00a0${amount}`);
    }
    cy.contains('A contratação dos planos ainda não está disponível.').should('be.visible');
    cy.contains('As aulas não usadas acumulam por mais um ciclo mensal.').should('be.visible');
    cy.contains('button', /assinar|contratar|comprar/i).should('not.exist');
    cy.contains('button', 'Professores').click();
    cy.get('section[aria-label="Conheça a Talkê"]').should(
      'contain.text',
      'Aula experimental gratuita',
    );
    cy.get('a[href="https://wa.me/5511965802237"]').should(
      'have.attr',
      'rel',
      'noopener noreferrer',
    );
    cy.get('article[aria-label="4 aulas por mês"]').should('contain.text', 'Essencial');
    cy.get('section[aria-label="Planos mensais"] article').should('have.length', 5);
    cy.contains('button', 'Planos').click();
    cy.get('h1').should('have.text', 'Planos mensais');
  });
  it('exibe privacidade e termos e exige login para reservar', () => {
    cy.visit('/');
    cy.contains('a', 'Aviso de privacidade').click();
    cy.contains('Privacidade e seus dados').should('be.visible');
    cy.get('article a[href="mailto:support@example.test"]').should('be.visible');
    cy.get('article a[href="mailto:alternate@example.test"]').should('be.visible');
    cy.contains('a', 'Termos de uso').click();
    cy.contains('A Talkê oferece reservas').should('be.visible');
    cy.request({ url: '/api/lessons', failOnStatusCode: false, headers: { 'x-is-admin': 'true' } })
      .its('status')
      .should('eq', 401);
  });
  it('mantém foco na reserva, fecha com Escape e devolve foco ao botão de origem', () => {
    login('student');
    cy.contains('button', 'Agendar').first().as('trigger').click();
    cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
    cy.get('[aria-label="Fechar reserva"]')
      .focus()
      .trigger('keydown', { key: 'Tab', shiftKey: true });
    cy.focused().should('have.attr', 'type', 'submit');
    cy.focused().trigger('keydown', { key: 'Tab' });
    cy.focused().should('have.attr', 'aria-label', 'Fechar reserva');
    cy.focused().trigger('keydown', { key: 'Escape' });
    cy.get('[role="dialog"]').should('not.exist');
    cy.get('@trigger').should('have.focus');
  });
  it('reserva na interface, aguarda confirmação real do servidor e cancela com reembolso pendente', () => {
    login('student');
    cy.contains('button', 'Agendar').first().click();
    cy.contains('Escolher Horário').should('be.visible');
    // Pick the day actually configured on the teacher, provided by the test fixture.
    cy.request({
      method: 'POST',
      url: '/_test/reset',
      headers: { 'x-test-key': 'local-e2e' },
    }).then(({ body }) => {
      const date = new Date(body.date + 'T12:00:00Z');
      const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      cy.contains('button', label).click();
    });
    cy.contains('button', '10:00').click();
    cy.contains('button', 'Confirmar Reserva').click();
    cy.contains('Aguardando pagamento').should('be.visible');
    cy.contains('Sem confirmação de pagamento').should('be.visible');
    token('student')
      .then((bearer) =>
        cy.request({ url: '/api/lessons', headers: { Authorization: 'Bearer ' + bearer } }),
      )
      .then(({ body }) => {
        const lesson = body[0];
        token('student')
          .then((bearer) =>
            cy.request({
              method: 'POST',
              url: '/api/lessons/' + lesson.id + '/checkout',
              headers: { Authorization: 'Bearer ' + bearer },
              body: {},
            }),
          )
          .its('body.url')
          .should('include', 'mercadopago.com.br');
        cy.request({
          method: 'POST',
          url: '/_test/approve/' + lesson.id,
          headers: { 'x-test-key': 'local-e2e' },
        });
      });
    cy.contains('button', 'Atualizar status').click();
    cy.contains('Pagamento confirmado').should('be.visible');
    cy.contains('button', 'Cancelar aula').click();
    cy.contains('button', 'Pagamentos').click();
    cy.contains('Reembolso em acompanhamento').should('be.visible');
  });
  it('usuário não acessa aulas, dados ou administração de terceiros', () => {
    login('other');
    cy.contains('button', 'Administração').should('not.exist');
    token('other').then((bearer) => {
      cy.request({
        url: '/api/students/student',
        headers: { Authorization: 'Bearer ' + bearer },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403);
      cy.request({
        url: '/api/privacy/export/student',
        headers: { Authorization: 'Bearer ' + bearer },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403);
      cy.request({
        url: '/api/admin/queue',
        headers: { Authorization: 'Bearer ' + bearer, 'x-is-admin': 'true' },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403);
    });
  });
  it('responsável cadastra menor, aguarda verificação e solicita seus dados com protocolo', () => {
    login('guardian');
    cy.contains('button', 'Família').click();
    cy.get('input[name="name"]').type('Dependente de teste');
    cy.get('input[name="birthDate"]').type('2016-01-01');
    cy.get('input[name="consent"]').check();
    cy.contains('button', 'Enviar para verificação').click();
    cy.contains('Cadastro enviado para verificação').should('be.visible');
    cy.get('[aria-label="Dependente"] option:not([value=""])')
      .should('have.length', 1)
      .last()
      .then((option) => {
        const childId = String(option.val());
        cy.get('[aria-label="Dependente"]').select(childId);
        token('guardian')
          .then((bearer) =>
            cy.request({
              method: 'POST',
              url: '/api/lessons',
              headers: {
                Authorization: 'Bearer ' + bearer,
                'Idempotency-Key': 'minor-booking-key-1234',
              },
              body: {
                studentId: childId,
                teacherId: 'teacher',
                scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
                startTime: '10:00',
                topic: '',
              },
              failOnStatusCode: false,
            }),
          )
          .its('status')
          .should('eq', 403);
        token('admin').then((bearer) =>
          cy.request({
            method: 'POST',
            url: '/api/admin/approve',
            headers: { Authorization: 'Bearer ' + bearer },
            body: {
              kind: 'guardian',
              subjectId: childId,
              evidenceReference: 'Procedimento de teste aprovado',
            },
          }),
        );
      });
    cy.contains('button', 'Meus dados').click();
    cy.get('select[name="kind"]').select('CORRECTION');
    cy.get('textarea[name="details"]').type('Corrigir nome do dependente');
    cy.contains('button', 'Enviar solicitação').click();
    cy.contains('Solicitação registrada. Protocolo:').should('be.visible');
  });
  it('solicitação LGPD aparece na fila administrativa e sessão encerrada limpa telas privadas', () => {
    login('student');
    cy.contains('button', 'Meus dados').click();
    cy.get('select[name="kind"]').select('ACCESS');
    cy.get('textarea[name="details"]').type('Informações de retenção e operadores');
    cy.contains('button', 'Enviar solicitação').click();
    cy.contains('Solicitação registrada').should('be.visible');
    token('admin')
      .then((bearer) =>
        cy.request({ url: '/api/admin/queue', headers: { Authorization: 'Bearer ' + bearer } }),
      )
      .its('body.privacyRequests')
      .should('have.length', 1);
    cy.contains('button', 'Sair').click();
    cy.contains('button', 'Meus dados').should('not.exist');
    cy.contains('button', 'Entrar com Google').should('be.visible');
  });
  it('resposta atrasada da conta anterior não reaparece depois da troca de sessão', () => {
    login('student');
    token('student').then((bearer) =>
      cy.request({
        method: 'POST',
        url: '/api/lessons',
        headers: {
          Authorization: 'Bearer ' + bearer,
          'Idempotency-Key': 'session-race-booking-123',
        },
        body: {
          studentId: 'student',
          teacherId: 'teacher',
          scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
          startTime: '10:00',
          topic: 'Conteúdo privado da conta anterior',
        },
      }),
    );
    cy.contains('button', 'Minhas aulas').click();
    cy.intercept('GET', '/api/lessons', (req) =>
      req.continue((res) => {
        res.setDelay(1500);
      }),
    ).as('delayedLessons');
    cy.contains('button', 'Atualizar status').click();
    cy.contains('button', 'Sair').click();
    cy.contains('button', 'Entrar com Google').should('be.visible');
    cy.get('[aria-label="E-mail de teste"]').type('other@example.test');
    cy.get('[aria-label="Senha de teste"]').type(password, { log: false });
    cy.contains('button', 'Entrar no emulador').click();
    cy.contains('button', 'Minhas aulas').click();
    cy.wait('@delayedLessons');
    cy.contains('Você ainda não tem aulas reservadas.').should('be.visible');
    cy.contains('Aguardando pagamento').should('not.exist');
  });
  it('cadastro novo rejeita menor autônomo e aguarda aferição de idade para adulto', () => {
    cy.visit('/');
    cy.get('[aria-label="E-mail de teste"]').type('newadult@example.test');
    cy.get('[aria-label="Senha de teste"]').type(password, { log: false });
    cy.contains('button', 'Entrar no emulador').click();
    cy.contains('Complete seu cadastro').should('be.visible');
    cy.get('input[name="name"]').type('Novo aluno');
    cy.get('input[name="birthDate"]').type('2016-01-01');
    cy.get('input[name="terms"]').check();
    cy.contains('button', 'Salvar cadastro').click();
    cy.contains('O cadastro de menores deve ser feito por um responsável adulto').should(
      'be.visible',
    );
    cy.get('input[name="birthDate"]').clear().type('1990-01-01');
    cy.contains('button', 'Salvar cadastro').click();
    cy.contains('Cadastro suspenso ou em análise de idade/vínculo').should('be.visible');
    cy.contains('button', 'Minhas aulas').should('not.exist');
    token('admin').then((bearer) =>
      cy.request({
        method: 'POST',
        url: '/api/admin/approve',
        headers: { Authorization: 'Bearer ' + bearer },
        body: {
          kind: 'age',
          subjectId: 'newadult',
          evidenceReference: 'Aferição de idade adulta verificada no teste',
        },
      }),
    );
    cy.contains('button', 'Atualizar cadastro').click();
    cy.contains('button', 'Minhas aulas').should('be.visible');
  });

  it('mostra saldo na página inicial e organiza a navegação no celular', () => {
    for (const endpoint of ['seed', 'enable'])
      cy.request({
        method: 'POST',
        url: '/_test/subscriptions/' + endpoint,
        headers: { 'x-test-key': 'local-e2e' },
      });
    cy.viewport(390, 844);
    login('student');
    cy.contains('button', 'Início').click();
    cy.get('section[aria-label="Resumo da sua conta"]').within(() => {
      cy.contains('Seu saldo de aulas').should('be.visible');
      cy.contains('Primeira validade:').should('be.visible');
    });
    cy.get('nav[aria-label="Navegação principal"]')
      .should('contain.text', 'Minhas aulas')
      .and('contain.text', 'Planos');
    cy.get('summary').contains('Mais opções').click();
    cy.contains('button', 'Meus dados').should('be.visible');
    cy.screenshot('talke-inicio-mobile', { capture: 'viewport' });
    cy.viewport(1280, 900);
  });
  it('professor prepara Meet exclusivo, aluno acessa somente no horário e acompanha sua confirmação', () => {
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/seed',
      headers: { 'x-test-key': 'local-e2e' },
    }).then(({ body }) => {
      token('student').then((bearer) =>
        cy
          .request({
            method: 'POST',
            url: '/api/subscriptions/' + body.subscriptionId + '/bookings',
            headers: { Authorization: 'Bearer ' + bearer, 'Idempotency-Key': crypto.randomUUID() },
            body: body.booking,
          })
          .then(({ body: lesson }) => cy.wrap(lesson.id).as('meetLesson')),
      );
    });
    for (const url of ['/_test/subscriptions/enable', '/_test/meet/enable'])
      cy.request({ method: 'POST', url, headers: { 'x-test-key': 'local-e2e' } });
    login('teacher');
    cy.contains('button', 'Meu perfil').click();
    cy.contains('Nos planos mensais, o repasse é de R$ 40').should('be.visible');
    cy.contains('Conectar Mercado Pago').should('not.exist');
    cy.get('input[name="price"]').should('not.exist');
    cy.contains('button', 'Minhas aulas').click();
    cy.contains('summary', 'Preparar Google Meet desta aula').click();
    cy.get('input[name="url"]').type('https://meet.google.com/abc-defg-hij');
    cy.get('input[name="controls"]').check();
    cy.contains('button', 'Salvar link da aula').click();
    cy.contains('Link salvo.').should('be.visible');
    cy.contains('button', 'Sair').click();
    login('student');
    cy.contains('button', 'Minhas aulas').click();
    cy.contains('button', 'Entrar na sala').click();
    cy.get('[role="dialog"]').should('contain.text', '10 minutos antes');
    cy.contains('button', 'Fechar sala').click();
    cy.get('@meetLesson').then((id) =>
      cy.request({
        method: 'POST',
        url: '/_test/meet/open/' + id,
        headers: { 'x-test-key': 'local-e2e' },
      }),
    );
    cy.contains('button', 'Entrar na sala').click();
    cy.contains('a', 'Abrir aula no Google Meet')
      .should('have.attr', 'href', 'https://meet.google.com/abc-defg-hij')
      .and('have.attr', 'rel', 'noopener noreferrer');
    cy.get('[role="dialog"]').should(
      'contain.text',
      'Fechar esta janela não encerra a chamada externa',
    );
    cy.screenshot('talke-aula-google-meet', { capture: 'viewport' });
    cy.contains('button', 'Fechar sala').click();
  });
  it('reserva uma aula do plano e libera um único repasse de R$40 após conclusão e confirmação', () => {
    cy.request({
      method: 'POST',
      url: '/_test/subscriptions/seed',
      headers: { 'x-test-key': 'local-e2e' },
    }).then(({ body }) => {
      token('student').then((bearer) => {
        cy.request({
          method: 'POST',
          url: `/api/subscriptions/${body.subscriptionId}/bookings`,
          headers: { Authorization: 'Bearer ' + bearer, 'Idempotency-Key': crypto.randomUUID() },
          body: body.booking,
        }).then(({ body: lesson }) => {
          expect(lesson.status).to.eq('CONFIRMED');
          expect(lesson.fundingSource).to.eq('ASAAS_SUBSCRIPTION');
          cy.request({
            method: 'POST',
            url: `/_test/subscriptions/finish/${lesson.id}`,
            headers: { 'x-test-key': 'local-e2e' },
          });
          token('teacher').then((teacherToken) =>
            cy.request({
              method: 'POST',
              url: `/api/lessons/${lesson.id}/complete`,
              headers: { Authorization: 'Bearer ' + teacherToken },
              body: {},
            }),
          );
          for (let i = 0; i < 2; i++)
            cy.request({
              method: 'POST',
              url: `/api/lessons/${lesson.id}/confirm-completion`,
              headers: { Authorization: 'Bearer ' + bearer },
              body: {},
            });
          cy.request({
            url: '/_test/subscriptions/status',
            headers: { 'x-test-key': 'local-e2e' },
          }).then(({ body: result }) => {
            expect(result.calls).to.eq(1);
            expect(result.transfers[0].value).to.eq(40);
            expect(result.transfers[0].status).to.eq('DONE');
          });
        });
      });
    });
  });
});
