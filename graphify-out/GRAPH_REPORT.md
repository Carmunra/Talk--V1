# Graph Report - talk-v1-production  (2026-10-11)

## Corpus Check
- 106 files · ~46,917 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 597 nodes · 1204 edges · 32 communities (26 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df36139e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- platform.ts
- App.tsx
- Money
- devDependencies
- requireCondition
- scripts
- compilerOptions
- Teacher
- dependencies
- smoke-container.mjs
- Preparação técnica e operação
- .prettierrc.json
- app.ts
- AppNotification
- fixture.ts
- marketplace.ts
- Row
- video.ts
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- PaymentGateway
- server.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- set-admin.ts
- TalkeLogo.tsx
- domain/types.ts
- Review
- MemoryStore
- verify-lockfile.mjs

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 38 edges
2. `Platform` - 33 edges
3. `Money` - 32 edges
4. `Teacher` - 26 edges
5. `Student` - 23 edges
6. `Lesson` - 20 edges
7. `ValidationError` - 19 edges
8. `Row` - 18 edges
9. `scripts` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/api.test.ts → src/server/app.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `MemoryStore` --implements--> `Store`  [EXTRACTED]
  tests/support/memory-store.ts → src/server/store.ts
- `FakeGateway` --implements--> `PaymentGateway`  [EXTRACTED]
  tests/support/fixture.ts → src/server/marketplace.ts
- `DiagnosticAndGoalViewProps` --references--> `Student`  [EXTRACTED]
  src/components/DiagnosticAndGoalView.tsx → src/domain/types.ts

## Import Cycles
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`

## Communities (32 total, 6 thin omitted)

### Community 0 - "platform.ts"
Cohesion: 0.39
Nodes (7): appointment(), bookingSchema, diagnosticSchema, minutes(), profileSchema, teacherSchema, time

### Community 1 - "App.tsx"
Cohesion: 0.10
Nodes (26): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), ErrorBoundary (+18 more)

### Community 2 - "Money"
Cohesion: 0.07
Nodes (3): LessonEntity, StudentEntity, Money

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.21
Nodes (3): Platform, requireCondition(), UnitOfWork

### Community 5 - "scripts"
Cohesion: 0.06
Nodes (32): engines, node, npm, chokidar, uuid, name, overrides, basic-ftp (+24 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): cypress, cypress.config.ts, DOM, DOM.Iterable, ES2022, scripts, server.ts, src (+19 more)

### Community 7 - "Teacher"
Cohesion: 0.08
Nodes (15): BookingModal(), BookingModalProps, StudentInteractiveHubProps, TeacherDirectory(), TeacherDirectoryProps, TeacherEntity, IStudentRepository, ITeacherRepository (+7 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+13 more)

### Community 10 - "Preparação técnica e operação"
Cohesion: 0.07
Nodes (26): Ativação, Entrega técnica, Manutenção e alertas, Preparação técnica e operação, Proteção do repositório, Resposta a incidente e reversão, Restauração e dados excluídos, Atendimento a titulares (+18 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "app.ts"
Cohesion: 0.18
Nodes (11): AppDependencies, AuthRequest, createApp(), Identity, PrivacyService, id, text, auth (+3 more)

### Community 13 - "AppNotification"
Cohesion: 0.21
Nodes (4): NotificationsPopoverProps, AppNotificationEntity, INotificationRepository, AppNotification

### Community 14 - "fixture.ts"
Cohesion: 0.37
Nodes (8): ProviderPayment, setup(), admin, fixture(), guardian, other, student, teacher

### Community 15 - "marketplace.ts"
Cohesion: 0.22
Nodes (6): MercadoPagoGateway, SellerTokens, ApiError, seal(), unseal(), verifyWebhook()

### Community 16 - "Row"
Cohesion: 0.19
Nodes (6): MaintenanceDependencies, runMaintenance(), FirestoreStore, Row, Store, now

### Community 17 - "video.ts"
Cohesion: 0.27
Nodes (3): RuntimeConfig, roomName(), VideoService

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 20 - "server.ts"
Cohesion: 0.17
Nodes (11): report, app, auth, config, firebase, platform, server, store (+3 more)

### Community 21 - "Categorização do backlog Talkê (TLK-1 a TLK-29)"
Cohesion: 0.29
Nodes (6): Categorização do backlog Talkê (TLK-1 a TLK-29), Sobre o dashboard ao vivo, Sprint 1 — Fundação (TLK-1 a TLK-14), Sprint 2 — Autenticação (TLK-15 a TLK-23), Sprint 3 — Diagnóstico (TLK-24 a TLK-29), Taxonomia proposta

### Community 30 - "domain/types.ts"
Cohesion: 0.05
Nodes (31): DiagnosticAndGoalView(), DiagnosticAndGoalViewProps, Question, MyLessonsViewProps, ReviewModalProps, PaymentTransactionEntity, DomainError, EntityNotFoundError (+23 more)

### Community 33 - "Review"
Cohesion: 0.22
Nodes (6): TeacherProfileModal(), TeacherProfileModalProps, ReviewEntity, IReviewRepository, ProficiencyLevelLabels, Review

## Knowledge Gaps
- **154 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Money` connect `Money` to `domain/types.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `App.tsx`, `domain/types.ts`, `Review`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09872241579558652 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.07357357357357357 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._