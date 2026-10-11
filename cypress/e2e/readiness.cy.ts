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
  if (uid === 'student' || uid === 'other')
    cy.intercept('GET', '/api/students/' + uid).as('currentStudent');
  cy.visit('/');
  cy.get('[aria-label="E-mail de teste"]').type(uid + '@example.test');
  cy.get('[aria-label="Senha de teste"]').type(password, { log: false });
  cy.contains('button', 'Entrar no emulador').click();
  cy.contains('button', 'Minhas aulas').should('be.visible');
  if (uid === 'student' || uid === 'other') {
    cy.wait('@currentStudent');
    cy.contains('Descubra seu Nível').should('be.visible');
  }
}
describe('Fluxos comerciais protegidos com Auth emulator e gateway de teste', () => {
  beforeEach(() => {
    cy.request({ method: 'POST', url: '/_test/reset', headers: { 'x-test-key': 'local-e2e' } });
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
    cy.get('[aria-label="Dependente"] option')
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
});
