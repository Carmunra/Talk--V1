# Graph Report - talk-v1-production  (2026-11-11)

## Corpus Check
- 158 files · ~88,453 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 894 nodes · 1927 edges · 66 communities (58 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6d973cc`
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
- Lesson
- useDialog
- subscriptions.ts
- marketplace.ts
- MemoryStore
- AsaasGateway
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- Row
- PaymentTransaction
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- runtime.py
- set-admin.ts
- TalkeLogo.tsx
- domain/types.ts
- video.ts
- TimeSlot
- server.ts
- post
- DomainError.ts
- Teacher
- platform.ts
- ReleaseTests
- verify-lockfile.mjs
- Review
- package.json
- overrides
- release.test.mjs
- VirtualClassroomModal.tsx
- Dados fornecidos para a publicação
- Preparação técnica e operação
- Hospedagem AWS da Talkê
- Publicação comercial — Brasil
- DOMINIO_HOSTINGER.md
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
- ErrorBoundary
- Validação das correções — 11 de outubro de 2026
- AuthContext.tsx
- Google Meet — operação de cada aula
- Preparação de lançamento — 11/11/2026

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 69 edges
2. `MonthlySubscriptions` - 37 edges
3. `Platform` - 35 edges
4. `Money` - 32 edges
5. `Teacher` - 26 edges
6. `Student` - 23 edges
7. `createApp()` - 22 edges
8. `Row` - 22 edges
9. `Lesson` - 20 edges
10. `ValidationError` - 19 edges

## Surprising Connections (you probably didn't know these)
- `validateRuntime()` --calls--> `readConfig()`  [EXTRACTED]
  scripts/release.ts → src/server/config.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `MemoryStore` --implements--> `Store`  [EXTRACTED]
  tests/support/memory-store.ts → src/server/store.ts
- `ReviewModalProps` --references--> `Lesson`  [EXTRACTED]
  src/components/ReviewModal.tsx → src/domain/types.ts
- `setup()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/api.test.ts → src/server/app.ts

## Import Cycles
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`

## Communities (66 total, 8 thin omitted)

### Community 0 - "fixture.ts"
Cohesion: 0.33
Nodes (12): createApp(), setup(), body, setup(), appFixture(), admin, fixture(), guardian (+4 more)

### Community 1 - "App.tsx"
Cohesion: 0.13
Nodes (16): VirtualClassroomModal, DiagnosticAndGoalView(), date(), FirstLessonJourney(), LaunchHome(), LaunchNavigation(), money, MonthlyPlans() (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.13
Nodes (9): cents(), Platform, requireCondition(), UnitOfWork, addCalendarMonths(), key(), localDate(), MonthlySubscriptions (+1 more)

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

### Community 12 - "Lesson"
Cohesion: 0.11
Nodes (8): MyLessonsViewProps, LessonEntity, ILessonRepository, BookingDomainService, Lesson, LessonStatus, PaymentMethod, mockTeacher

### Community 13 - "useDialog"
Cohesion: 0.27
Nodes (7): BookingModal(), BookingModalProps, ReviewModal(), ReviewModalProps, TeacherProfileModal(), bookingDates(), useDialog()

### Community 14 - "subscriptions.ts"
Cohesion: 0.11
Nodes (21): MONTHLY_PLANS, asaasPaymentSchema, AsaasSandboxGateway, AsaasSubscription, asaasSubscriptionSchema, AsaasTransfer, asaasTransferSchema, identifier (+13 more)

### Community 15 - "marketplace.ts"
Cohesion: 0.27
Nodes (4): MercadoPagoGateway, SellerTokens, seal(), unseal()

### Community 17 - "AsaasGateway"
Cohesion: 0.07
Nodes (4): AsaasGateway, AsaasPayment, SubscriptionGateway, FakeSubscriptions

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 19 - "Row"
Cohesion: 0.11
Nodes (7): MaintenanceDependencies, runMaintenance(), PaymentGateway, ProviderPayment, Row, FakeGateway, now

### Community 20 - "PaymentTransaction"
Cohesion: 0.23
Nodes (3): PaymentTransactionEntity, IPaymentRepository, PaymentTransaction

### Community 21 - "Categorização do backlog Talkê (TLK-1 a TLK-29)"
Cohesion: 0.29
Nodes (6): Categorização do backlog Talkê (TLK-1 a TLK-29), Sobre o dashboard ao vivo, Sprint 1 — Fundação (TLK-1 a TLK-14), Sprint 2 — Autenticação (TLK-15 a TLK-23), Sprint 3 — Diagnóstico (TLK-24 a TLK-29), Taxonomia proposta

### Community 22 - "runtime.py"
Cohesion: 0.33
Nodes (21): await_ready(), aws(), command(), config(), docker(), health(), login(), main() (+13 more)

### Community 24 - "set-admin.ts"
Cohesion: 0.33
Nodes (6): AdminAuth, parseAdminArguments(), setAdminPermission(), args, auth, firebase

### Community 29 - "domain/types.ts"
Cohesion: 0.12
Nodes (18): DiagnosticAndGoalViewProps, Question, TeacherDirectory(), TeacherDirectoryProps, IStudentRepository, MatchingService, LearningGoalLabels, LessonStatusLabels (+10 more)

### Community 30 - "video.ts"
Cohesion: 0.19
Nodes (4): RuntimeConfig, Store, roomName(), VideoService

### Community 32 - "server.ts"
Cohesion: 0.16
Nodes (11): report, app, auth, config, firebase, platform, server, store (+3 more)

### Community 33 - "post"
Cohesion: 0.36
Nodes (9): App(), FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), MeetLinkForm(), api() (+1 more)

### Community 34 - "DomainError.ts"
Cohesion: 0.16
Nodes (8): DomainError, EntityNotFoundError, InsufficientFundsError, InvalidLessonStateError, ScheduleConflictError, ValidationError, CommissionBreakdown, CommissionService

### Community 35 - "Teacher"
Cohesion: 0.14
Nodes (6): StudentInteractiveHubProps, TeacherEntity, ITeacherRepository, AvailabilitySlot, LearningGoal, Teacher

### Community 36 - "platform.ts"
Cohesion: 0.16
Nodes (14): AppDependencies, AuthRequest, Identity, PrivacyService, ApiError, verifyWebhook(), appointment(), bookingSchema (+6 more)

### Community 39 - "Review"
Cohesion: 0.11
Nodes (8): NotificationsPopoverProps, TeacherProfileModalProps, AppNotificationEntity, ReviewEntity, INotificationRepository, IReviewRepository, AppNotification, Review

### Community 40 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, npm, name, private, type, version

### Community 41 - "overrides"
Cohesion: 0.12
Nodes (16): chokidar, uuid, minimatch, undici, overrides, basic-ftp, fast-uri, firebase-tools (+8 more)

### Community 42 - "release.test.mjs"
Cohesion: 0.32
Nodes (4): publish(), settings(), env, sha

### Community 43 - "VirtualClassroomModal.tsx"
Cohesion: 0.43
Nodes (4): Props, VirtualClassroomModal(), isGoogleMeetUrl(), UserRole

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

### Community 49 - "DOMINIO_HOSTINGER.md"
Cohesion: 0.22
Nodes (7): Resultado, Validação do e-mail talke.club — 11/10/2026, Alternativa Google Cloud, não selecionada, Ativação da alternativa Google Cloud, Conectar talke.club, Consulta pública antes da mudança, Rota AWS escolhida

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
Cohesion: 0.40
Nodes (4): Custo e limites, Integridade e revisão, Plano de homologação AWS — 12/10/2026, Recursos previstos

### Community 61 - "ErrorBoundary"
Cohesion: 0.22
Nodes (4): ErrorBoundary, Props, State, AuthProvider()

### Community 62 - "Validação das correções — 11 de outubro de 2026"
Cohesion: 0.67
Nodes (3): Limites da evidência e próxima liberação, O que os testes demonstram, Validação das correções — 11 de outubro de 2026

### Community 63 - "AuthContext.tsx"
Cohesion: 0.27
Nodes (8): AuthState, Context, Session, useAuth(), app, auth, authReady, googleProvider

### Community 65 - "Google Meet — operação de cada aula"
Cohesion: 0.40
Nodes (5): Antes da aula, Durante e depois, Google Meet — operação de cada aula, Homologação que ainda precisa ocorrer em contas reais, Revogação, incidentes e privacidade

### Community 66 - "Preparação de lançamento — 11/11/2026"
Cohesion: 0.50
Nodes (4): Entrega desta revisão, Estado de publicação e trabalho externo pendente, Evidência local, Preparação de lançamento — 11/11/2026

## Knowledge Gaps
- **234 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+229 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireCondition()` connect `requireCondition` to `fixture.ts`, `platform.ts`, `VirtualClassroomModal.tsx`, `subscriptions.ts`, `marketplace.ts`, `AsaasGateway`, `Row`, `video.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `isGoogleMeetUrl()` connect `VirtualClassroomModal.tsx` to `video.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `App.tsx`, `Review`, `Lesson`, `useDialog`, `domain/types.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _234 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12615384615384614 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.08735632183908046 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._