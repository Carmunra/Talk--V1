# Graph Report - talk-v1-production  (2026-10-08)

## Corpus Check
- 93 files · ~42,568 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 575 nodes · 1161 edges · 39 communities (32 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `99ce1e5e`
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
- Teacher
- dependencies
- Store
- Publicação comercial — Brasil
- .prettierrc.json
- platform.ts
- AppNotification
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
- DomainError.ts
- ProficiencyLevel
- Student
- Review
- domain/types.ts
- PaymentTransaction
- TeacherDirectory.tsx
- MemoryStore
- verify-lockfile.mjs

## God Nodes (most connected - your core abstractions)
1. `requireCondition()` - 37 edges
2. `Platform` - 33 edges
3. `Money` - 32 edges
4. `Teacher` - 26 edges
5. `Student` - 23 edges
6. `Lesson` - 20 edges
7. `ValidationError` - 19 edges
8. `compilerOptions` - 16 edges
9. `scripts` - 15 edges
10. `ProficiencyLevel` - 15 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/api.test.ts → src/server/app.ts
- `FakeGateway` --implements--> `PaymentGateway`  [EXTRACTED]
  tests/support/fixture.ts → src/server/marketplace.ts
- `MemoryStore` --implements--> `Store`  [EXTRACTED]
  tests/support/memory-store.ts → src/server/store.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `BookingModalProps` --references--> `Teacher`  [EXTRACTED]
  src/components/BookingModal.tsx → src/domain/types.ts

## Import Cycles
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`

## Communities (39 total, 7 thin omitted)

### Community 0 - "Lesson"
Cohesion: 0.11
Nodes (6): MyLessonsViewProps, ReviewModalProps, LessonEntity, ILessonRepository, Lesson, PaymentMethod

### Community 1 - "App.tsx"
Cohesion: 0.11
Nodes (24): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), ErrorBoundary (+16 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.12
Nodes (5): MercadoPagoGateway, PaymentGateway, Platform, requireCondition(), UnitOfWork

### Community 5 - "scripts"
Cohesion: 0.06
Nodes (30): engines, node, npm, chokidar, uuid, name, overrides, basic-ftp (+22 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): cypress, cypress.config.ts, DOM, DOM.Iterable, ES2022, scripts, server.ts, src (+19 more)

### Community 7 - "Teacher"
Cohesion: 0.16
Nodes (4): TeacherEntity, ITeacherRepository, AvailabilitySlot, Teacher

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+13 more)

### Community 10 - "Publicação comercial — Brasil"
Cohesion: 0.09
Nodes (19): Atendimento a titulares, Identificação e documentos, LGPD, menores e atendimento — requisitos de operação, Menores e aferição de idade, Operadores, transferências e incidentes, Comandos, Contratos, atendimento e obrigações financeiras, Dados legados e continuidade (+11 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "platform.ts"
Cohesion: 0.17
Nodes (13): AppDependencies, Identity, PrivacyService, ApiError, appointment(), bookingSchema, diagnosticSchema, id (+5 more)

### Community 13 - "AppNotification"
Cohesion: 0.19
Nodes (4): NotificationsPopoverProps, AppNotificationEntity, INotificationRepository, AppNotification

### Community 14 - "fixture.ts"
Cohesion: 0.41
Nodes (8): readConfig(), setup(), admin, fixture(), guardian, other, student, teacher

### Community 15 - "marketplace.ts"
Cohesion: 0.44
Nodes (4): SellerTokens, seal(), unseal(), verifyWebhook()

### Community 16 - "reconcile.ts"
Cohesion: 0.24
Nodes (5): config, firebase, platform, store, FirestoreStore

### Community 17 - "createApp"
Cohesion: 0.36
Nodes (4): AuthRequest, createApp(), roomName(), VideoService

### Community 18 - "Refinamento — Sprint 1: primeiras 3 tarefas de código"
Cohesion: 0.17
Nodes (11): 5 erros comuns nessa fase (e como evitar), As 3 primeiras tarefas (ordem obrigatória, não escolha livre), Boas práticas aplicadas nesse refinamento, Diagnóstico do estado atual (feito lendo o repo, não suposição), Exercício antes de codarmos juntos, O que fica para depois (e por quê), Refinamento — Sprint 1: primeiras 3 tarefas de código, Subtasks refinadas (como um Tech Lead faria no planning) (+3 more)

### Community 19 - "Row"
Cohesion: 0.21
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

### Community 30 - "DomainError.ts"
Cohesion: 0.18
Nodes (7): DomainError, EntityNotFoundError, InsufficientFundsError, InvalidLessonStateError, ValidationError, CommissionBreakdown, CommissionService

### Community 31 - "ProficiencyLevel"
Cohesion: 0.20
Nodes (8): DiagnosticAndGoalView(), DiagnosticAndGoalViewProps, Question, ScheduleConflictError, BookingDomainService, LearningGoal, ProficiencyLevel, mockTeacher

### Community 32 - "Student"
Cohesion: 0.21
Nodes (5): BookingModal(), BookingModalProps, StudentInteractiveHubProps, IStudentRepository, Student

### Community 33 - "Review"
Cohesion: 0.22
Nodes (6): TeacherProfileModal(), TeacherProfileModalProps, ReviewEntity, IReviewRepository, LearningGoalLabels, Review

### Community 34 - "domain/types.ts"
Cohesion: 0.18
Nodes (7): TALKE_CURRICULUM_MATERIALS, LessonStatus, LessonStatusLabels, StudentDevelopmentRecord, TalkeMaterialItem, TalkeModuleTier, TalkeSlidePage

### Community 35 - "PaymentTransaction"
Cohesion: 0.21
Nodes (4): PaymentTransactionEntity, IPaymentRepository, PaymentStatus, PaymentTransaction

### Community 36 - "TeacherDirectory.tsx"
Cohesion: 0.26
Nodes (7): TeacherDirectory(), TeacherDirectoryProps, MatchingService, MatchRecommendation, ProficiencyLevelLabels, mockStudent, mockTeachers

## Knowledge Gaps
- **146 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+141 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Money` connect `Money` to `PaymentTransaction`, `DomainError.ts`, `Teacher`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `Student`, `App.tsx`, `Review`, `domain/types.ts`, `TeacherDirectory.tsx`, `ProficiencyLevel`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _146 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lesson` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10931174089068826 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.09359605911330049 - nodes in this community are weakly interconnected._