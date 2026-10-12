# Graph Report - talk-v1-production  (2026-10-12)

## Corpus Check
- 143 files · ~73,386 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 817 nodes · 1754 edges · 60 communities (53 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfbc7d0a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- domain/types.ts
- App.tsx
- Money
- devDependencies
- requireCondition
- scripts
- compilerOptions
- release.ts
- dependencies
- smoke-container.mjs
- PUBLICACAO.md
- .prettierrc.json
- Lesson
- SubscriptionGateway
- fixture.ts
- marketplace.ts
- Store
- createApp
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- PaymentGateway
- server.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- runtime.py
- set-admin.ts
- TalkeLogo.tsx
- BookingModal.tsx
- subscriptions.ts
- TimeSlot
- VALIDACAO.md
- Student
- DomainError.ts
- Teacher
- platform.ts
- ReleaseTests
- verify-lockfile.mjs
- AppNotification
- package.json
- overrides
- release.test.mjs
- react-dom
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
- Review
- config.ts
- ProficiencyLevel
- asaas.ts
- Validações de publicação - 12/10/2026

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 66 edges
2. `Platform` - 35 edges
3. `MonthlySubscriptions` - 34 edges
4. `Money` - 32 edges
5. `Teacher` - 26 edges
6. `Student` - 23 edges
7. `Row` - 22 edges
8. `Lesson` - 20 edges
9. `ValidationError` - 19 edges
10. `createApp()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `validateRuntime()` --calls--> `readConfig()`  [EXTRACTED]
  scripts/release.ts → src/server/config.ts
- `setup()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/api.test.ts → src/server/app.ts
- `appFixture()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/subscriptions.test.ts → src/server/app.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `ReviewModalProps` --references--> `Lesson`  [EXTRACTED]
  src/components/ReviewModal.tsx → src/domain/types.ts

## Import Cycles
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`

## Communities (60 total, 7 thin omitted)

### Community 0 - "domain/types.ts"
Cohesion: 0.25
Nodes (5): LessonStatusLabels, PaymentStatus, StudentDevelopmentRecord, TalkeModuleTier, TalkeSlidePage

### Community 1 - "App.tsx"
Cohesion: 0.08
Nodes (30): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), DiagnosticAndGoalView() (+22 more)

### Community 2 - "Money"
Cohesion: 0.06
Nodes (5): LessonEntity, PaymentTransactionEntity, IPaymentRepository, PaymentTransaction, Money

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.10
Nodes (9): MONTHLY_PLANS, AsaasSandboxGateway, cents(), Platform, requireCondition(), addCalendarMonths(), key(), localDate() (+1 more)

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
Cohesion: 0.11
Nodes (19): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+11 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "Lesson"
Cohesion: 0.15
Nodes (8): MyLessonsViewProps, ScheduleConflictError, ILessonRepository, BookingDomainService, Lesson, LessonStatus, PaymentMethod, mockTeacher

### Community 13 - "SubscriptionGateway"
Cohesion: 0.08
Nodes (3): AsaasPayment, SubscriptionGateway, FakeSubscriptions

### Community 14 - "fixture.ts"
Cohesion: 0.21
Nodes (17): setup(), appFixture(), auth, firebase, host, server, subscriptionGateway, subscriptions (+9 more)

### Community 15 - "marketplace.ts"
Cohesion: 0.22
Nodes (6): MercadoPagoGateway, SellerTokens, ApiError, seal(), unseal(), verifyWebhook()

### Community 16 - "Store"
Cohesion: 0.20
Nodes (3): RuntimeConfig, Store, MemoryStore

### Community 17 - "createApp"
Cohesion: 0.42
Nodes (3): createApp(), roomName(), VideoService

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 19 - "PaymentGateway"
Cohesion: 0.12
Nodes (3): PaymentGateway, ProviderPayment, FakeGateway

### Community 20 - "server.ts"
Cohesion: 0.16
Nodes (8): app, auth, config, firebase, platform, server, store, FirestoreStore

### Community 21 - "Categorização do backlog Talkê (TLK-1 a TLK-29)"
Cohesion: 0.29
Nodes (6): Categorização do backlog Talkê (TLK-1 a TLK-29), Sobre o dashboard ao vivo, Sprint 1 — Fundação (TLK-1 a TLK-14), Sprint 2 — Autenticação (TLK-15 a TLK-23), Sprint 3 — Diagnóstico (TLK-24 a TLK-29), Taxonomia proposta

### Community 22 - "runtime.py"
Cohesion: 0.33
Nodes (21): await_ready(), aws(), command(), config(), docker(), health(), login(), main() (+13 more)

### Community 24 - "set-admin.ts"
Cohesion: 0.33
Nodes (6): AdminAuth, parseAdminArguments(), setAdminPermission(), args, auth, firebase

### Community 29 - "BookingModal.tsx"
Cohesion: 0.18
Nodes (12): BookingModal(), BookingModalProps, ReviewModal(), ReviewModalProps, TeacherProfileModal(), TeacherProfileModalProps, Props, VirtualClassroomModal() (+4 more)

### Community 30 - "subscriptions.ts"
Cohesion: 0.20
Nodes (8): AsaasTransfer, MaintenanceDependencies, runMaintenance(), Row, UnitOfWork, adverse(), MONTHLY_TEACHER_PAYOUT_CENTS, now

### Community 32 - "VALIDACAO.md"
Cohesion: 0.39
Nodes (3): Limites da evidência e próxima liberação, O que os testes demonstram, Validação das correções — 11 de outubro de 2026

### Community 33 - "Student"
Cohesion: 0.16
Nodes (9): TeacherDirectory(), TeacherDirectoryProps, IStudentRepository, MatchingService, MatchRecommendation, ProficiencyLevelLabels, Student, mockStudent (+1 more)

### Community 34 - "DomainError.ts"
Cohesion: 0.17
Nodes (7): DomainError, EntityNotFoundError, InsufficientFundsError, InvalidLessonStateError, ValidationError, CommissionBreakdown, CommissionService

### Community 35 - "Teacher"
Cohesion: 0.22
Nodes (3): StudentInteractiveHubProps, ITeacherRepository, Teacher

### Community 36 - "platform.ts"
Cohesion: 0.18
Nodes (13): AppDependencies, AuthRequest, Identity, PrivacyService, appointment(), bookingSchema, diagnosticSchema, id (+5 more)

### Community 39 - "AppNotification"
Cohesion: 0.22
Nodes (4): NotificationsPopoverProps, AppNotificationEntity, INotificationRepository, AppNotification

### Community 40 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, npm, name, private, type, version

### Community 41 - "overrides"
Cohesion: 0.25
Nodes (8): chokidar, uuid, overrides, basic-ftp, firebase-tools, @grpc/grpc-js, @opentelemetry/core, re2

### Community 42 - "release.test.mjs"
Cohesion: 0.32
Nodes (4): publish(), settings(), env, sha

### Community 45 - "Dados fornecidos para a publicação"
Cohesion: 0.67
Nodes (3): Configuração e acesso, Dados fornecidos para a publicação, Pendências de definição e acesso

### Community 46 - "Preparação técnica e operação"
Cohesion: 0.29
Nodes (7): Ativação, Entrega técnica, Manutenção e alertas, Preparação técnica e operação, Proteção do repositório, Resposta a incidente e reversão, Restauração e dados excluídos

### Community 47 - "Hospedagem AWS da Talkê"
Cohesion: 0.29
Nodes (7): Custos e aprovação antes de ativar, Estrutura preparada, Formato do segredo, Hospedagem AWS da Talkê, Preparação das contas, Provisionamento revisável, Publicação e recuperação

### Community 48 - "Publicação comercial — Brasil"
Cohesion: 0.29
Nodes (7): Comandos, Contratos, atendimento e obrigações financeiras, Dados legados e continuidade, Homologação Mercado Pago pendente, O que mudou, Preparação e implantação, Publicação comercial — Brasil

### Community 49 - "Conectar talke.club"
Cohesion: 0.40
Nodes (5): Alternativa Google Cloud, não selecionada, Ativação da alternativa Google Cloud, Conectar talke.club, Consulta pública antes da mudança, Rota AWS escolhida

### Community 50 - "LGPD, menores e atendimento — requisitos de operação"
Cohesion: 0.40
Nodes (5): Atendimento a titulares, Identificação e documentos, LGPD, menores e atendimento — requisitos de operação, Menores e aferição de idade, Operadores, transferências e incidentes

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

### Community 55 - "Review"
Cohesion: 0.33
Nodes (3): ReviewEntity, IReviewRepository, Review

### Community 56 - "config.ts"
Cohesion: 0.42
Nodes (4): report, readConfig(), preflight(), env

### Community 57 - "ProficiencyLevel"
Cohesion: 0.16
Nodes (7): DiagnosticAndGoalViewProps, Question, StudentEntity, TeacherEntity, AvailabilitySlot, LearningGoal, ProficiencyLevel

### Community 58 - "asaas.ts"
Cohesion: 0.25
Nodes (7): asaasPaymentSchema, AsaasSubscription, asaasSubscriptionSchema, asaasTransferSchema, identifier, value, verifyAsaasWebhook()

### Community 59 - "Validações de publicação - 12/10/2026"
Cohesion: 0.40
Nodes (5): Asaas Sandbox: o que foi efetivamente validado, Bloqueios para publicação, Evidências técnicas, Regras e referência comercial, Validações de publicação - 12/10/2026

## Knowledge Gaps
- **205 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireCondition()` connect `requireCondition` to `platform.ts`, `marketplace.ts`, `createApp`, `asaas.ts`, `subscriptions.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `domain/types.ts`, `App.tsx`, `Student`, `Lesson`, `ProficiencyLevel`, `BookingModal.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Money` connect `Money` to `ProficiencyLevel`, `DomainError.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._