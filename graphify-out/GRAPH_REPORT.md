# Graph Report - talk-v1-production  (2026-10-12)

## Corpus Check
- 148 files · ~78,995 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 839 nodes · 1813 edges · 61 communities (50 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bee0d8fb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AsaasGateway
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
- SubscriptionGateway
- fixture.ts
- security.ts
- MemoryStore
- createApp
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- FakeGateway
- server.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- runtime.py
- set-admin.ts
- TalkeLogo.tsx
- matchingService.ts
- Row
- TimeSlot
- Validação das correções — 11 de outubro de 2026
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
- LessonEntity
- Preparação da contratação e publicação — 12/10/2026
- Validações de publicação - 12/10/2026
- DNS_EMAIL.md

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 67 edges
2. `Platform` - 35 edges
3. `MonthlySubscriptions` - 35 edges
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
- `FakeGateway` --implements--> `PaymentGateway`  [EXTRACTED]
  tests/support/fixture.ts → src/server/marketplace.ts

## Import Cycles
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`

## Communities (61 total, 11 thin omitted)

### Community 1 - "App.tsx"
Cohesion: 0.06
Nodes (47): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), AdminSubscriptions() (+39 more)

### Community 2 - "Money"
Cohesion: 0.07
Nodes (4): PaymentTransactionEntity, IPaymentRepository, PaymentTransaction, Money

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.11
Nodes (11): AppDependencies, cents(), Identity, Platform, PrivacyService, requireCondition(), UnitOfWork, addCalendarMonths() (+3 more)

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

### Community 12 - "domain/types.ts"
Cohesion: 0.12
Nodes (12): MyLessonsViewProps, ScheduleConflictError, ILessonRepository, BookingDomainService, Lesson, LessonStatus, LessonStatusLabels, PaymentStatus (+4 more)

### Community 13 - "SubscriptionGateway"
Cohesion: 0.08
Nodes (3): AsaasPayment, SubscriptionGateway, FakeSubscriptions

### Community 14 - "fixture.ts"
Cohesion: 0.20
Nodes (18): setup(), appFixture(), auth, firebase, host, rateLimitStores, server, subscriptionGateway (+10 more)

### Community 15 - "security.ts"
Cohesion: 0.27
Nodes (4): MercadoPagoGateway, seal(), unseal(), verifyWebhook()

### Community 17 - "createApp"
Cohesion: 0.36
Nodes (4): AuthRequest, createApp(), roomName(), VideoService

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

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

### Community 29 - "matchingService.ts"
Cohesion: 0.25
Nodes (5): TeacherDirectory(), MatchingService, MatchRecommendation, mockStudent, mockTeachers

### Community 30 - "Row"
Cohesion: 0.13
Nodes (8): RuntimeConfig, MaintenanceDependencies, runMaintenance(), PaymentGateway, SellerTokens, Row, Store, now

### Community 32 - "Validação das correções — 11 de outubro de 2026"
Cohesion: 0.67
Nodes (3): Limites da evidência e próxima liberação, O que os testes demonstram, Validação das correções — 11 de outubro de 2026

### Community 33 - "Student"
Cohesion: 0.13
Nodes (13): BookingModalProps, DiagnosticAndGoalViewProps, Question, StudentInteractiveHubProps, TeacherDirectoryProps, TeacherProfileModalProps, StudentEntity, IStudentRepository (+5 more)

### Community 34 - "DomainError.ts"
Cohesion: 0.17
Nodes (7): DomainError, EntityNotFoundError, InsufficientFundsError, InvalidLessonStateError, ValidationError, CommissionBreakdown, CommissionService

### Community 35 - "Teacher"
Cohesion: 0.17
Nodes (4): TeacherEntity, ITeacherRepository, AvailabilitySlot, Teacher

### Community 36 - "platform.ts"
Cohesion: 0.12
Nodes (22): MONTHLY_PLANS, asaasPaymentSchema, AsaasSandboxGateway, AsaasSubscription, asaasSubscriptionSchema, AsaasTransfer, asaasTransferSchema, identifier (+14 more)

### Community 39 - "AppNotification"
Cohesion: 0.21
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

### Community 58 - "Preparação da contratação e publicação — 12/10/2026"
Cohesion: 0.33
Nodes (6): Configuração segura, Implementação concluída nesta etapa, O que exige o operador/fornecedores, Preparação da contratação e publicação — 12/10/2026, Referências primárias de integração, Validação

### Community 59 - "Validações de publicação - 12/10/2026"
Cohesion: 0.40
Nodes (5): Asaas Sandbox: o que foi efetivamente validado, Bloqueios para publicação, Evidências técnicas, Regras e referência comercial, Validações de publicação - 12/10/2026

## Knowledge Gaps
- **211 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireCondition()` connect `requireCondition` to `AsaasGateway`, `platform.ts`, `security.ts`, `createApp`, `Row`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `App.tsx`, `DomainError.ts`, `Student`, `domain/types.ts`, `matchingService.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Money` connect `Money` to `DomainError.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05997778600518327 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.07112375533428165 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._