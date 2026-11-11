# Graph Report - talk-v1-production  (2026-11-11)

## Corpus Check
- 162 files · ~92,075 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 910 nodes · 1975 edges · 69 communities (58 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5410961`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- fixture.ts
- App.tsx
- Money
- devDependencies
- requireCondition
- scripts
- compilerOptions
- release.ts
- dependencies
- smoke-container.mjs
- .prettierrc.json
- domain/types.ts
- useDialog
- app.ts
- marketplace.ts
- MemoryStore
- AsaasGateway
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- FakeGateway
- PaymentTransactionEntity.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- runtime.py
- readiness.cy.ts
- set-admin.ts
- TalkeLogo.tsx
- Student
- Row
- TimeSlot
- server.ts
- post
- DomainError.ts
- Teacher
- platform.ts
- ReleaseTests
- verify-lockfile.mjs
- AppNotification
- package.json
- overrides
- release.test.mjs
- Review
- Dados fornecidos para a publicação
- Preparação técnica e operação
- Hospedagem AWS da Talkê
- Publicação comercial — Brasil
- Conectar talke.club
- LGPD, menores e atendimento — requisitos de operação
- Publicação automática e reversão
- Talkê
- Planos mensais — homologação Asaas
- Planos mensais da Talkê
- FirestoreStore
- Preparação da contratação e publicação — 12/10/2026
- SubscriptionPanel.tsx
- Continuidade da publicação — 12/10/2026
- Validações de publicação - 12/10/2026
- Plano de homologação AWS — 12/10/2026
- AuthContext.tsx
- Validação das correções — 11 de outubro de 2026
- e2e-server.ts
- PlanLessonCancellation.tsx
- Google Meet — operação de cada aula
- Preparação de lançamento — 11/11/2026
- Cancelamento e remarcação das aulas — 11/11/2026
- Validação do e-mail talke.club — 11/10/2026

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 70 edges
2. `MonthlySubscriptions` - 38 edges
3. `Platform` - 35 edges
4. `Money` - 32 edges
5. `Teacher` - 26 edges
6. `createApp()` - 24 edges
7. `Student` - 23 edges
8. `Row` - 22 edges
9. `Lesson` - 20 edges
10. `ValidationError` - 19 edges

## Surprising Connections (you probably didn't know these)
- `validateRuntime()` --calls--> `readConfig()`  [EXTRACTED]
  scripts/release.ts → src/server/config.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `FakeGateway` --implements--> `PaymentGateway`  [EXTRACTED]
  tests/support/fixture.ts → src/server/marketplace.ts
- `MemoryStore` --implements--> `Store`  [EXTRACTED]
  tests/support/memory-store.ts → src/server/store.ts
- `ReviewModalProps` --references--> `Lesson`  [EXTRACTED]
  src/components/ReviewModal.tsx → src/domain/types.ts

## Import Cycles
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`

## Communities (69 total, 11 thin omitted)

### Community 0 - "fixture.ts"
Cohesion: 0.23
Nodes (15): createApp(), PrivacyService, setup(), body, setup(), setup(), appFixture(), admin (+7 more)

### Community 1 - "App.tsx"
Cohesion: 0.13
Nodes (16): VirtualClassroomModal, DiagnosticAndGoalView(), date(), FirstLessonJourney(), LaunchHome(), LaunchNavigation(), money, MonthlyPlans() (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.09
Nodes (12): AppDependencies, cents(), MercadoPagoGateway, PaymentGateway, Identity, Platform, requireCondition(), UnitOfWork (+4 more)

### Community 5 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, admin:permissions, build, cypress:run, dev, lint, payments:reconcile, publication:check (+9 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): cypress, cypress.config.ts, DOM, DOM.Iterable, ES2022, scripts, server.ts, src (+19 more)

### Community 7 - "release.ts"
Cohesion: 0.18
Nodes (15): Config, exec, executeRelease(), probeRelease(), releaseConfig(), ReleaseDependencies, requireRelease(), Run (+7 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+13 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "domain/types.ts"
Cohesion: 0.12
Nodes (11): MyLessonsViewProps, ScheduleConflictError, ILessonRepository, BookingDomainService, Lesson, LessonStatus, LessonStatusLabels, StudentDevelopmentRecord (+3 more)

### Community 13 - "useDialog"
Cohesion: 0.17
Nodes (11): BookingModal(), BookingModalProps, ReviewModal(), ReviewModalProps, TeacherProfileModal(), Props, VirtualClassroomModal(), isGoogleMeetUrl() (+3 more)

### Community 14 - "app.ts"
Cohesion: 0.16
Nodes (14): MONTHLY_PLANS, AuthRequest, asaasPaymentSchema, AsaasSubscription, asaasSubscriptionSchema, AsaasTransfer, asaasTransferSchema, identifier (+6 more)

### Community 15 - "marketplace.ts"
Cohesion: 0.35
Nodes (5): SellerTokens, ApiError, seal(), unseal(), verifyWebhook()

### Community 17 - "AsaasGateway"
Cohesion: 0.07
Nodes (5): AsaasGateway, AsaasPayment, AsaasSandboxGateway, SubscriptionGateway, FakeSubscriptions

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 20 - "PaymentTransactionEntity.ts"
Cohesion: 0.18
Nodes (5): PaymentTransactionEntity, IPaymentRepository, PaymentMethod, PaymentStatus, PaymentTransaction

### Community 21 - "Categorização do backlog Talkê (TLK-1 a TLK-29)"
Cohesion: 0.29
Nodes (6): Categorização do backlog Talkê (TLK-1 a TLK-29), Sobre o dashboard ao vivo, Sprint 1 — Fundação (TLK-1 a TLK-14), Sprint 2 — Autenticação (TLK-15 a TLK-23), Sprint 3 — Diagnóstico (TLK-24 a TLK-29), Taxonomia proposta

### Community 22 - "runtime.py"
Cohesion: 0.33
Nodes (21): await_ready(), aws(), command(), config(), docker(), health(), login(), main() (+13 more)

### Community 24 - "set-admin.ts"
Cohesion: 0.33
Nodes (6): AdminAuth, parseAdminArguments(), setAdminPermission(), args, auth, firebase

### Community 29 - "Student"
Cohesion: 0.11
Nodes (16): DiagnosticAndGoalViewProps, Question, StudentInteractiveHubProps, TeacherDirectory(), TeacherDirectoryProps, StudentEntity, IStudentRepository, MatchingService (+8 more)

### Community 30 - "Row"
Cohesion: 0.14
Nodes (8): RuntimeConfig, MaintenanceDependencies, runMaintenance(), Row, Store, roomName(), VideoService, now

### Community 32 - "server.ts"
Cohesion: 0.16
Nodes (11): report, app, auth, config, firebase, platform, server, store (+3 more)

### Community 33 - "post"
Cohesion: 0.36
Nodes (9): App(), FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), MeetLinkForm(), api() (+1 more)

### Community 34 - "DomainError.ts"
Cohesion: 0.17
Nodes (7): DomainError, EntityNotFoundError, InsufficientFundsError, InvalidLessonStateError, ValidationError, CommissionBreakdown, CommissionService

### Community 35 - "Teacher"
Cohesion: 0.17
Nodes (4): TeacherEntity, ITeacherRepository, AvailabilitySlot, Teacher

### Community 36 - "platform.ts"
Cohesion: 0.39
Nodes (7): appointment(), bookingSchema, diagnosticSchema, minutes(), profileSchema, teacherSchema, time

### Community 39 - "AppNotification"
Cohesion: 0.22
Nodes (4): NotificationsPopoverProps, AppNotificationEntity, INotificationRepository, AppNotification

### Community 40 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, npm, name, private, type, version

### Community 41 - "overrides"
Cohesion: 0.12
Nodes (16): chokidar, uuid, minimatch, undici, overrides, basic-ftp, fast-uri, firebase-tools (+8 more)

### Community 42 - "release.test.mjs"
Cohesion: 0.32
Nodes (4): publish(), settings(), env, sha

### Community 43 - "Review"
Cohesion: 0.29
Nodes (4): TeacherProfileModalProps, ReviewEntity, IReviewRepository, Review

### Community 45 - "Dados fornecidos para a publicação"
Cohesion: 0.67
Nodes (3): Configuração e acesso, Dados fornecidos para a publicação, Pendências de definição e acesso

### Community 46 - "Preparação técnica e operação"
Cohesion: 0.29
Nodes (7): Ativação, Entrega técnica, Manutenção e alertas, Preparação técnica e operação, Proteção do repositório, Resposta a incidente e reversão, Restauração e dados excluídos

### Community 47 - "Hospedagem AWS da Talkê"
Cohesion: 0.25
Nodes (8): Custos e aprovação antes de ativar, Estrutura preparada, Formato do segredo, Hospedagem AWS da Talkê, Preparação das contas, Provisionamento revisável, Publicação e recuperação, Video selecionado e atualizacao do controlador

### Community 48 - "Publicação comercial — Brasil"
Cohesion: 0.29
Nodes (7): Comandos, Contratos, atendimento e obrigações financeiras, Dados legados e continuidade, Homologação Mercado Pago pendente, O que mudou, Preparação e implantação, Publicação comercial — Brasil

### Community 49 - "Conectar talke.club"
Cohesion: 0.40
Nodes (5): Alternativa Google Cloud, não selecionada, Ativação da alternativa Google Cloud, Conectar talke.club, Consulta pública antes da mudança, Rota AWS escolhida

### Community 50 - "LGPD, menores e atendimento — requisitos de operação"
Cohesion: 0.33
Nodes (6): Atendimento a titulares, Identificação e documentos, LGPD, menores e atendimento — requisitos de operação, Menores e aferição de idade, Operadores, transferências e incidentes, Video externo e menores

### Community 51 - "Publicação automática e reversão"
Cohesion: 0.40
Nodes (5): Configuração, Execução, Falha e reversão, Identidade da publicação, Publicação automática e reversão

### Community 52 - "Talkê"
Cohesion: 0.50
Nodes (4): API e identidade, Desenvolvimento, Talkê, Verificação

### Community 53 - "Planos mensais — homologação Asaas"
Cohesion: 0.33
Nodes (6): Antes de qualquer liberação real, Configuração e limites, Dados pessoais, Fluxo implementado para homologação, Operação e acesso, Planos mensais — homologação Asaas

### Community 54 - "Planos mensais da Talkê"
Cohesion: 0.33
Nodes (6): Asaas selecionado para preparação, Documento comercial recebido, Integração financeira pendente, Planos mensais da Talkê, Repasse dos planos confirmado, Validade das aulas confirmada

### Community 56 - "Preparação da contratação e publicação — 12/10/2026"
Cohesion: 0.33
Nodes (6): Configuração segura, Implementação concluída nesta etapa, O que exige o operador/fornecedores, Preparação da contratação e publicação — 12/10/2026, Referências primárias de integração, Validação

### Community 57 - "SubscriptionPanel.tsx"
Cohesion: 0.30
Nodes (8): AdminSubscriptions(), brl(), date(), PendingCheckout, SubscriptionPanel(), SubscriptionPurchase(), SubscriptionSummary, checkoutLink()

### Community 58 - "Continuidade da publicação — 12/10/2026"
Cohesion: 0.33
Nodes (6): AWS e bloqueios de lançamento, Continuidade da publicação — 12/10/2026, Referências de integração, Regra aprovada e implementação, Testes externos autorizados — somente Asaas Sandbox, Validação desta alteração

### Community 59 - "Validações de publicação - 12/10/2026"
Cohesion: 0.40
Nodes (5): Asaas Sandbox: o que foi efetivamente validado, Bloqueios para publicação, Evidências técnicas, Regras e referência comercial, Validações de publicação - 12/10/2026

### Community 60 - "Plano de homologação AWS — 12/10/2026"
Cohesion: 0.50
Nodes (4): Custo e limites, Integridade e revisão, Plano de homologação AWS — 12/10/2026, Recursos previstos

### Community 61 - "AuthContext.tsx"
Cohesion: 0.13
Nodes (12): ErrorBoundary, Props, State, AuthProvider(), AuthState, Context, Session, useAuth() (+4 more)

### Community 62 - "Validação das correções — 11 de outubro de 2026"
Cohesion: 0.67
Nodes (3): Limites da evidência e próxima liberação, O que os testes demonstram, Validação das correções — 11 de outubro de 2026

### Community 63 - "e2e-server.ts"
Cohesion: 0.22
Nodes (8): auth, firebase, host, rateLimitStores, server, subscriptionGateway, subscriptions, account

### Community 64 - "PlanLessonCancellation.tsx"
Cohesion: 0.60
Nodes (4): PlanLessonCancellation(), canCancelPlanLesson(), PLAN_LESSON_CANCELLATION_HOURS, PLAN_LESSON_CANCELLATION_MS

### Community 65 - "Google Meet — operação de cada aula"
Cohesion: 0.40
Nodes (5): Antes da aula, Durante e depois, Google Meet — operação de cada aula, Homologação que ainda precisa ocorrer em contas reais, Revogação, incidentes e privacidade

### Community 66 - "Preparação de lançamento — 11/11/2026"
Cohesion: 0.50
Nodes (4): Entrega desta revisão, Estado de publicação e trabalho externo pendente, Evidência local, Preparação de lançamento — 11/11/2026

### Community 67 - "Cancelamento e remarcação das aulas — 11/11/2026"
Cohesion: 0.40
Nodes (5): Aprovação para produção, Cancelamento e remarcação das aulas — 11/11/2026, Fluxo do aluno ou responsável, Pedidos tardios, faltas e suporte, Vídeo e segurança

## Knowledge Gaps
- **238 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireCondition()` connect `requireCondition` to `fixture.ts`, `platform.ts`, `useDialog`, `app.ts`, `marketplace.ts`, `AsaasGateway`, `Row`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `isGoogleMeetUrl()` connect `useDialog` to `Row`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `App.tsx`, `DomainError.ts`, `Review`, `domain/types.ts`, `useDialog`, `Student`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12666666666666668 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.07765151515151515 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._