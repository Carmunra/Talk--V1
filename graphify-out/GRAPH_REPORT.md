# Graph Report - talk-v1-production  (2026-10-11)

## Corpus Check
- 112 files · ~50,886 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 625 nodes · 1260 edges · 36 communities (27 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9621ee0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Lesson
- App.tsx
- Money
- devDependencies
- requireCondition
- scripts
- compilerOptions
- release.ts
- dependencies
- smoke-container.mjs
- Preparação técnica e operação
- .prettierrc.json
- platform.ts
- Review
- fixture.ts
- MercadoPagoGateway
- marketplace.ts
- VideoService
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- PaymentGateway
- server.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- package.json
- set-admin.ts
- TalkeLogo.tsx
- overrides
- domain/types.ts
- TimeSlot
- e2e-server.ts
- react-dom
- UnitOfWork
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
- `validateRuntime()` --calls--> `readConfig()`  [EXTRACTED]
  scripts/release.ts → src/server/config.ts
- `ReviewModalProps` --references--> `Lesson`  [EXTRACTED]
  src/components/ReviewModal.tsx → src/domain/types.ts

## Import Cycles
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`

## Communities (36 total, 9 thin omitted)

### Community 0 - "Lesson"
Cohesion: 0.12
Nodes (5): MyLessonsViewProps, LessonEntity, ILessonRepository, Lesson, PaymentMethod

### Community 1 - "App.tsx"
Cohesion: 0.07
Nodes (36): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), BookingModal() (+28 more)

### Community 2 - "Money"
Cohesion: 0.07
Nodes (4): PaymentTransactionEntity, IPaymentRepository, PaymentTransaction, Money

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.22
Nodes (3): Platform, requireCondition(), minutes()

### Community 5 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, admin:permissions, build, cypress:run, dev, lint, payments:reconcile, publication:check (+9 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): cypress, cypress.config.ts, DOM, DOM.Iterable, ES2022, scripts, server.ts, src (+19 more)

### Community 7 - "release.ts"
Cohesion: 0.13
Nodes (19): report, Config, exec, executeRelease(), probeRelease(), releaseConfig(), ReleaseDependencies, requireRelease() (+11 more)

### Community 8 - "dependencies"
Cohesion: 0.11
Nodes (19): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+11 more)

### Community 10 - "Preparação técnica e operação"
Cohesion: 0.06
Nodes (31): Ativação, Entrega técnica, Manutenção e alertas, Preparação técnica e operação, Proteção do repositório, Resposta a incidente e reversão, Restauração e dados excluídos, Atendimento a titulares (+23 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "platform.ts"
Cohesion: 0.19
Nodes (13): AppDependencies, AuthRequest, createApp(), Identity, PrivacyService, appointment(), bookingSchema, diagnosticSchema (+5 more)

### Community 13 - "Review"
Cohesion: 0.12
Nodes (7): NotificationsPopoverProps, AppNotificationEntity, ReviewEntity, INotificationRepository, IReviewRepository, AppNotification, Review

### Community 14 - "fixture.ts"
Cohesion: 0.37
Nodes (8): ProviderPayment, setup(), admin, fixture(), guardian, other, student, teacher

### Community 15 - "MercadoPagoGateway"
Cohesion: 0.27
Nodes (4): MercadoPagoGateway, seal(), unseal(), verifyWebhook()

### Community 16 - "marketplace.ts"
Cohesion: 0.17
Nodes (8): RuntimeConfig, MaintenanceDependencies, runMaintenance(), SellerTokens, ApiError, Row, Store, now

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 20 - "server.ts"
Cohesion: 0.16
Nodes (8): app, auth, config, firebase, platform, server, store, FirestoreStore

### Community 21 - "Categorização do backlog Talkê (TLK-1 a TLK-29)"
Cohesion: 0.29
Nodes (6): Categorização do backlog Talkê (TLK-1 a TLK-29), Sobre o dashboard ao vivo, Sprint 1 — Fundação (TLK-1 a TLK-14), Sprint 2 — Autenticação (TLK-15 a TLK-23), Sprint 3 — Diagnóstico (TLK-24 a TLK-29), Taxonomia proposta

### Community 22 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, npm, name, private, type, version

### Community 29 - "overrides"
Cohesion: 0.25
Nodes (8): chokidar, uuid, overrides, basic-ftp, firebase-tools, @grpc/grpc-js, @opentelemetry/core, re2

### Community 30 - "domain/types.ts"
Cohesion: 0.05
Nodes (36): DiagnosticAndGoalView(), DiagnosticAndGoalViewProps, Question, StudentInteractiveHubProps, TeacherDirectory(), TeacherDirectoryProps, StudentEntity, TeacherEntity (+28 more)

### Community 32 - "e2e-server.ts"
Cohesion: 0.40
Nodes (4): auth, firebase, host, server

## Knowledge Gaps
- **166 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Money` connect `Money` to `domain/types.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Teacher` connect `domain/types.ts` to `Lesson`, `App.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lesson` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07205513784461152 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.07254623044096728 - nodes in this community are weakly interconnected._