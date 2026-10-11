# Graph Report - talk-v1-production  (2026-10-11)

## Corpus Check
- 118 files · ~52,594 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 643 nodes · 1287 edges · 40 communities (32 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54b85184`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Teacher
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
- config.ts
- AppNotification
- fixture.ts
- marketplace.ts
- Row
- createApp
- Refinamento — Sprint 1: primeiras 3 tarefas de código
- PaymentGateway
- server.ts
- Categorização do backlog Talkê (TLK-1 a TLK-29)
- Store
- set-admin.ts
- TalkeLogo.tsx
- Lesson
- DomainError.ts
- TimeSlot
- ProficiencyLevel
- PaymentTransaction
- Student
- Review
- matchingService.ts
- MemoryStore
- verify-lockfile.mjs
- domain/types.ts

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
- `validateRuntime()` --calls--> `readConfig()`  [EXTRACTED]
  scripts/release.ts → src/server/config.ts
- `setup()` --calls--> `createApp()`  [EXTRACTED]
  tests/integration/api.test.ts → src/server/app.ts
- `fixture()` --calls--> `readConfig()`  [EXTRACTED]
  tests/support/fixture.ts → src/server/config.ts
- `MemoryStore` --implements--> `Store`  [EXTRACTED]
  tests/support/memory-store.ts → src/server/store.ts
- `FakeGateway` --implements--> `PaymentGateway`  [EXTRACTED]
  tests/support/fixture.ts → src/server/marketplace.ts

## Import Cycles
- 3-file cycle: `src/domain/repositories/ILessonRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ILessonRepository.ts`
- 3-file cycle: `src/domain/entities/LessonEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/LessonEntity.ts`
- 3-file cycle: `src/domain/repositories/INotificationRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/INotificationRepository.ts`
- 3-file cycle: `src/domain/entities/PaymentTransactionEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/PaymentTransactionEntity.ts`
- 3-file cycle: `src/domain/repositories/IPaymentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IPaymentRepository.ts`
- 3-file cycle: `src/domain/repositories/IReviewRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IReviewRepository.ts`
- 3-file cycle: `src/domain/repositories/IStudentRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/IStudentRepository.ts`
- 3-file cycle: `src/domain/repositories/ITeacherRepository.ts -> src/domain/types.ts -> src/domain/repositories/index.ts -> src/domain/repositories/ITeacherRepository.ts`
- 3-file cycle: `src/domain/entities/TeacherEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/TeacherEntity.ts`
- 3-file cycle: `src/domain/entities/AppNotificationEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/AppNotificationEntity.ts`
- 3-file cycle: `src/domain/entities/ReviewEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/ReviewEntity.ts`
- 3-file cycle: `src/domain/entities/StudentEntity.ts -> src/domain/types.ts -> src/domain/entities/index.ts -> src/domain/entities/StudentEntity.ts`

## Communities (40 total, 8 thin omitted)

### Community 0 - "Teacher"
Cohesion: 0.16
Nodes (8): TeacherDirectory(), TeacherDirectoryProps, TeacherProfileModal(), TeacherProfileModalProps, ITeacherRepository, LearningGoalLabels, ProficiencyLevelLabels, Teacher

### Community 1 - "App.tsx"
Cohesion: 0.11
Nodes (25): App(), VirtualClassroomModal, FamilyForm(), PrivacyPanel(), Registration(), TeacherEditor(), AdminPanel(), ErrorBoundary (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): c8, cypress, esbuild, @firebase/rules-unit-testing, firebase-tools, devDependencies, c8, cypress (+31 more)

### Community 4 - "requireCondition"
Cohesion: 0.12
Nodes (15): AppDependencies, Identity, Platform, PrivacyService, requireCondition(), UnitOfWork, appointment(), bookingSchema (+7 more)

### Community 5 - "scripts"
Cohesion: 0.06
Nodes (32): engines, node, npm, chokidar, uuid, name, overrides, basic-ftp (+24 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): cypress, cypress.config.ts, DOM, DOM.Iterable, ES2022, scripts, server.ts, src (+19 more)

### Community 7 - "release.ts"
Cohesion: 0.18
Nodes (15): Config, exec, executeRelease(), probeRelease(), releaseConfig(), ReleaseDependencies, requireRelease(), Run (+7 more)

### Community 8 - "dependencies"
Cohesion: 0.10
Nodes (21): @daily-co/daily-js, express, express-rate-limit, firebase, firebase-admin, helmet, lucide-react, dependencies (+13 more)

### Community 10 - "Preparação técnica e operação"
Cohesion: 0.05
Nodes (38): Configuração e acesso, Dados fornecidos para a publicação, Pendências de definição e acesso, Ativação, Conectar talke.club, Consulta pública antes da mudança, Rota preparada, Ativação (+30 more)

### Community 11 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

### Community 12 - "config.ts"
Cohesion: 0.46
Nodes (4): report, readConfig(), preflight(), env

### Community 13 - "AppNotification"
Cohesion: 0.22
Nodes (4): NotificationsPopoverProps, AppNotificationEntity, INotificationRepository, AppNotification

### Community 14 - "fixture.ts"
Cohesion: 0.27
Nodes (11): setup(), auth, firebase, host, server, admin, fixture(), guardian (+3 more)

### Community 15 - "marketplace.ts"
Cohesion: 0.22
Nodes (6): MercadoPagoGateway, SellerTokens, ApiError, seal(), unseal(), verifyWebhook()

### Community 16 - "Row"
Cohesion: 0.28
Nodes (5): MaintenanceDependencies, runMaintenance(), ProviderPayment, Row, now

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

### Community 24 - "set-admin.ts"
Cohesion: 0.33
Nodes (6): AdminAuth, parseAdminArguments(), setAdminPermission(), args, auth, firebase

### Community 29 - "Lesson"
Cohesion: 0.09
Nodes (13): BookingModal(), MyLessonsViewProps, ReviewModal(), ReviewModalProps, Props, VirtualClassroomModal(), LessonEntity, ILessonRepository (+5 more)

### Community 30 - "DomainError.ts"
Cohesion: 0.13
Nodes (11): DomainError, EntityNotFoundError, InsufficientFundsError, InvalidLessonStateError, ScheduleConflictError, ValidationError, BookingDomainService, CommissionBreakdown (+3 more)

### Community 32 - "ProficiencyLevel"
Cohesion: 0.19
Nodes (7): DiagnosticAndGoalView(), DiagnosticAndGoalViewProps, Question, TeacherEntity, AvailabilitySlot, LearningGoal, ProficiencyLevel

### Community 33 - "PaymentTransaction"
Cohesion: 0.23
Nodes (4): PaymentTransactionEntity, IPaymentRepository, PaymentStatus, PaymentTransaction

### Community 34 - "Student"
Cohesion: 0.24
Nodes (4): BookingModalProps, StudentInteractiveHubProps, IStudentRepository, Student

### Community 35 - "Review"
Cohesion: 0.33
Nodes (3): ReviewEntity, IReviewRepository, Review

### Community 36 - "matchingService.ts"
Cohesion: 0.29
Nodes (4): MatchingService, MatchRecommendation, mockStudent, mockTeachers

### Community 39 - "domain/types.ts"
Cohesion: 0.29
Nodes (4): LessonStatusLabels, StudentDevelopmentRecord, TalkeModuleTier, TalkeSlidePage

## Knowledge Gaps
- **172 isolated node(s):** `singleQuote`, `trailingComma`, `printWidth`, `name`, `private` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Money` connect `Money` to `ProficiencyLevel`, `DomainError.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Teacher` connect `Teacher` to `ProficiencyLevel`, `App.tsx`, `Student`, `matchingService.ts`, `domain/types.ts`, `Lesson`, `DomainError.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Student` connect `Student` to `ProficiencyLevel`, `App.tsx`, `Teacher`, `Money`, `matchingService.ts`, `domain/types.ts`, `Lesson`, `DomainError.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `singleQuote`, `trailingComma`, `printWidth` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._
- **Should `Money` be split into smaller, more focused modules?**
  _Cohesion score 0.09195402298850575 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._