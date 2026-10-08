# Graph Report - talk-v1-production  (2026-10-08)

## Corpus Check
- 92 files · ~42,398 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 572 nodes · 1159 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89e35314`
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
- Teacher
- dependencies
- Store
- Publicação comercial — Brasil
- .prettierrc.json
- platform.ts
- Review
- fixture.ts
- marketplace.ts
- reconcile.ts
- createApp
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- Row
- server.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- TimeSlot
- set-admin.ts
- TalkeLogo.tsx
- e2e-server.ts

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 37 edges
2. `Platform` - 33 edges
3. `Money` - 32 edges
4. `Teacher` - 26 edges
5. `Student` - 23 edges
6. `Lesson` - 20 edges
7. `ValidationError` - 19 edges
8. `compilerOptions` - 16 edges
9. `ProficiencyLevel` - 15 edges
10. `createApp()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/api.test.ts → src/server/app.ts
- `FakeGateway` --implements--> `PaymentGateway`  [EXTRACTED]
  tests/support/fixture.ts → src/server/marketplace.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `MemoryStore` --implements--> `Store`  [EXTRACTED]
  tests/support/memory-store.ts → src/server/store.ts
- `DiagnosticAndGoalViewProps` --references--> `Student`  [EXTRACTED]
  src/components/DiagnosticAndGoalView.tsx → src/domain/types.ts

## Import Cycles
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`

## Communities (30 total, 3 thin omitted)

### Community 0 - "domain/types.ts"
Cohesion: 0.06
Nodes (29): DiagnosticAndGoalView(), DiagnosticAndGoalViewProps, Question, MyLessonsViewProps, ReviewModalProps, LessonEntity, StudentEntity, DomainError (+21 more)

### Community 1 - "App.tsx"
Cohesion: 0.10
Nodes (26): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), ErrorBoundary (+18 more)

### Community 2 - "Money"
Cohesion: 0.07
Nodes (4): PaymentTransactionEntity, IPaymentRepository, PaymentTransaction, Money

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.14
Nodes (4): MercadoPagoGateway, PaymentGateway, Platform, requireCondition()

### Community 5 - "scripts"
Cohesion: 0.07
Nodes (29): engines, node, npm, chokidar, uuid, name, overrides, basic-ftp (+21 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): cypress, cypress.config.ts, DOM, DOM.Iterable, ES2022, scripts, server.ts, src (+19 more)

### Community 7 - "Teacher"
Cohesion: 0.07
Nodes (18): BookingModal(), BookingModalProps, StudentInteractiveHubProps, TeacherDirectory(), TeacherDirectoryProps, TeacherProfileModal(), TeacherProfileModalProps, TeacherEntity (+10 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+13 more)

### Community 9 - "Store"
Cohesion: 0.15
Nodes (4): RuntimeConfig, Store, UnitOfWork, MemoryStore

### Community 10 - "Publicação comercial — Brasil"
Cohesion: 0.09
Nodes (19): Atendimento a titulares, Identificação e documentos, LGPD, menores e atendimento — requisitos de operação, Menores e aferição de idade, Operadores, transferências e incidentes, Comandos, Contratos, atendimento e obrigações financeiras, Dados legados e continuidade (+11 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "platform.ts"
Cohesion: 0.18
Nodes (13): AppDependencies, AuthRequest, Identity, PrivacyService, appointment(), bookingSchema, diagnosticSchema, id (+5 more)

### Community 13 - "Review"
Cohesion: 0.12
Nodes (7): NotificationsPopoverProps, AppNotificationEntity, ReviewEntity, INotificationRepository, IReviewRepository, AppNotification, Review

### Community 14 - "fixture.ts"
Cohesion: 0.41
Nodes (8): readConfig(), setup(), admin, fixture(), guardian, other, student, teacher

### Community 15 - "marketplace.ts"
Cohesion: 0.35
Nodes (5): SellerTokens, ApiError, seal(), unseal(), verifyWebhook()

### Community 16 - "reconcile.ts"
Cohesion: 0.24
Nodes (5): config, firebase, platform, store, FirestoreStore

### Community 17 - "createApp"
Cohesion: 0.42
Nodes (3): createApp(), roomName(), VideoService

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 19 - "Row"
Cohesion: 0.24
Nodes (3): ProviderPayment, Row, FakeGateway

### Community 20 - "server.ts"
Cohesion: 0.22
Nodes (7): app, auth, config, firebase, platform, server, store

### Community 21 - "Categorização do backlog Talkê (TLK-1 a TLK-29)"
Cohesion: 0.29
Nodes (6): Categorização do backlog Talkê (TLK-1 a TLK-29), Sobre o dashboard ao vivo, Sprint 1 — Fundação (TLK-1 a TLK-14), Sprint 2 — Autenticação (TLK-15 a TLK-23), Sprint 3 — Diagnóstico (TLK-24 a TLK-29), Taxonomia proposta

### Community 29 - "e2e-server.ts"
Cohesion: 0.40
Nodes (4): auth, firebase, host, server

## Knowledge Gaps
- **144 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+139 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Money` connect `Money` to `domain/types.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `domain/types.ts`, `App.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Lesson` connect `domain/types.ts` to `App.tsx`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _144 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `domain/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05759623861298854 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09872241579558652 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.07254623044096728 - nodes in this community are weakly interconnected._