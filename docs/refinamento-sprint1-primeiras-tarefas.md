# Refinamento — Sprint 1: primeiras 3 tarefas de código

**Projeto:** Talkê | **Data:** 01/07/2026 | **Autor:** Betinha (mentor técnico)

## Diagnóstico do estado atual (feito lendo o repo, não suposição)

- `.git` existe, mas **zero commits**. Branch `main` sem histórico.
- Solution `.sln` já organizada em Clean Architecture: `Talke.Api`, `Talke.Application`, `Talke.Domain`, `Talke.Infrastructure`.
- `Program.cs` ainda é o template padrão do `dotnet new webapi` (WeatherForecast). Nada de DI, CORS, logging ou controllers reais.
- `Talke.Domain/Entities/*.cs` (Student, Teacher, Lesson, CreditPackage, CreditWallet, TeacherRecommendation) **existem mas estão vazios**. Enums também vazios.
- Nenhum pacote de EF Core / Npgsql referenciado em nenhum `.csproj`. Nenhum `DbContext`. Pastas `Persistence/Configurations`, `Persistence/Migrations`, `Persistence/Seed` existem vazias.
- `docs/docker-compose.yml` existe mas está vazio (0 bytes).
- `tests/` vazio.

Conclusão: você já fez o trabalho de **arquitetar as pastas** (isso é ótimo, mostra que pensou em Clean Architecture antes de sair digitando). Mas ainda não escreveu nenhuma linha de código de verdade. As 3 tarefas abaixo são exatamente o ponto onde a arquitetura vira código.

## As 3 primeiras tarefas (ordem obrigatória, não escolha livre)

```
TLK-6 (repo/branching) ──▶ TLK-4 (modelagem/entidades) ──▶ TLK-9 (PostgreSQL + EF Core)
   fundação                   o "o quê"                        o "como persiste"
```

1. **TLK-6 — Finalizar setup do repositório e branching.** Está incompleto (sem commit). Prioridade máxima: enquanto não existe 1 commit, você não tem *rollback*, não tem histórico, e se seu PC quebrar amanhã, o projeto some. Isso não é sobre C#, é sobre não perder trabalho.
2. **TLK-4 — Modelagem de dados (as entidades).** As classes já têm nome e lugar certo, mas estão vazias. Isso é literalmente onde você aprende Programação Orientada a Objetos aplicada: atributos, encapsulamento, relacionamentos. Sem isso pronto, TLK-9 e TLK-5 não têm o que persistir/expor.
3. **TLK-9 — PostgreSQL + EF Core.** Só faz sentido depois que as entidades existem, porque o EF Core mapeia classes → tabelas. Aqui você aprende ORM, migrations e Dependency Injection na prática.

**TLK-7 (setup do backend .NET)** não é uma 4ª tarefa separada agora — ele fica ~30% pronto (a solution existe) e o resto (`Program.cs` real, DI, appsettings) é concluído *dentro* do trabalho de TLK-9, porque é lá que você registra o `DbContext` no `Program.cs`.

## O que fica para depois (e por quê)

| Tarefa | Por que espera |
|---|---|
| TLK-1, TLK-2, TLK-3 (hosting, pagamento, e-mail) | São decisões de negócio, não bloqueiam código local. Decidir agora é over-engineering (YAGNI) — decida quando for fazer deploy/cobrança de verdade. |
| TLK-5 (contrato de API) | Depende do modelo de dados existir (TLK-4). Desenhar DTO antes da entidade existir é desenhar no vácuo. |
| TLK-10 a TLK-14 (ambientes, CI/CD, domínio, monitoramento, analytics) | São infraestrutura de *deploy*. Não fazem sentido sem uma API rodando com persistência (TLK-9) primeiro. |

---

## Subtasks refinadas (como um Tech Lead faria no planning)

### TLK-6 — Setup do repositório e estratégia de branching

| ID | Subtask | Critério de aceite |
|---|---|---|
| TLK-6.1 | Commit inicial (`chore: initial commit - clean architecture skeleton`) | `git log` mostra ao menos 1 commit; `git status` limpo |
| TLK-6.2 | Criar repositório remoto (GitHub/Azure DevOps) e conectar `origin` | `git remote -v` mostra origin; `git push` funciona |
| TLK-6.3 | Definir estratégia de branching (recomendo **trunk-based simplificado**: `main` sempre estável + branches curtas `feature/TLK-XX-descricao`) | Documentado em `docs/CONTRIBUTING.md` |
| TLK-6.4 | Criar `README.md` (o que é o projeto, como rodar localmente) | Arquivo existe e cobre setup em < 5 passos |
| TLK-6.5 | Revisar `.gitignore` (já existe e está bom: `bin/`, `obj/`, `.env`, `appsettings.Local.json`) | Nenhum arquivo sensível rastreado após primeiro commit |

**Definition of Done:** repo com histórico, remoto configurado, regra de branch documentada, README existe.
**Estimativa:** 1–2h (é setup, não é o gargalo do aprendizado).

### TLK-4 — Modelagem de dados (ERD → Entidades C#)

| ID | Subtask | Critério de aceite |
|---|---|---|
| TLK-4.1 | Desenhar o ERD em texto/diagrama antes de codar (relacionamentos entre Student, Teacher, Lesson, CreditWallet, CreditPackage, TeacherRecommendation) | Diagrama salvo em `docs/erd.md` (pode ser ASCII ou Mermaid) |
| TLK-4.2 | Implementar `Entity.cs` base (Id, talvez `CreatedAt`) em `Domain/Common` | Classe compila e é reaproveitada pelas outras |
| TLK-4.3 | Implementar os 5 enums (`UserRole`, `ProficiencyLevel`, `LearningStyle`, `LessonStatus`, `TeacherApprovalStatus`) | Cada enum com valores reais, não vazio |
| TLK-4.4 | Implementar `Student.cs` e `Teacher.cs` com propriedades e **encapsulamento** (setters privados, construtor validando) | Nenhuma propriedade com `set` público sem necessidade |
| TLK-4.5 | Implementar `Lesson.cs`, `CreditWallet.cs`, `CreditPackage.cs`, `TeacherRecommendation.cs` com relacionamentos (referências entre entidades) | Relacionamentos refletem o ERD do TLK-4.1 |

**Definition of Done:** todas as entidades compilam, têm propriedades reais, seguem encapsulamento (não é um "bag of properties" público).
**Estimativa:** 3–5h — é o coração do aprendizado de POO aqui, não tenha pressa.

### TLK-9 — PostgreSQL + EF Core

| ID | Subtask | Critério de aceite |
|---|---|---|
| TLK-9.1 | Adicionar pacotes `Npgsql.EntityFrameworkCore.PostgreSQL` e `Microsoft.EntityFrameworkCore.Design` em `Talke.Infrastructure` | `dotnet build` funciona |
| TLK-9.2 | Criar `AppDbContext` em `Persistence/` com um `DbSet<T>` por entidade | Classe existe e herda de `DbContext` |
| TLK-9.3 | Criar `IEntityTypeConfiguration<T>` para cada entidade em `Persistence/Configurations` (Fluent API, não Data Annotations) | Mapeamento não polui as entidades do Domain com atributos de EF |
| TLK-9.4 | Preencher `docs/docker-compose.yml` com serviço PostgreSQL | `docker compose up` sobe um Postgres local |
| TLK-9.5 | Configurar connection string via `appsettings.Development.json` (nunca commitada com senha real — usar placeholder + `.env`/user-secrets) | Sem credencial real no git |
| TLK-9.6 | Rodar primeira migration (`dotnet ef migrations add InitialCreate`) e aplicar (`dotnet ef database update`) | Tabelas aparecem no Postgres |
| TLK-9.7 | Registrar `AppDbContext` no `Program.cs` via `AddDbContext` | API sobe sem erro de DI |

**Definition of Done:** API conecta no Postgres local, migration inicial aplicada, sem segredo commitado.
**Estimativa:** 4–6h — inclui aprender EF Core do zero, então é normal levar mais tempo que o previsto.

---

## Boas práticas aplicadas nesse refinamento

- **YAGNI**: decisões de negócio (hosting, pagamento) ficaram pra depois — não trave o código esperando decisão que não afeta o dev local.
- **Encapsulamento sobre Anemic Domain Model**: entidades com setters privados e regras de negócio dentro delas, não classes "burras" que só carregam dados.
- **Clean Architecture respeitada**: `Domain` não deve conhecer EF Core. É por isso que `Talke.Domain.csproj` não deve ganhar pacote de Npgsql — isso vai só em `Infrastructure`.
- **Segurança**: nenhuma senha de banco em `appsettings.json` commitado — seu `.gitignore` já protege `.env` e `appsettings.Local.json`, use isso.

## 5 erros comuns nessa fase (e como evitar)

1. **Ficar dias sem commitar** (era o seu caso agora) → commit pequeno e frequente, mesmo incompleto, em branch de feature.
2. **Anemic Domain Model** (entidades só com `get; set;` público em tudo) → force-se a pensar "que regra essa entidade protege?" antes de criar o setter.
3. **EF Core vazando pro Domain** (referenciar Npgsql em `Talke.Domain`) → se o `Domain.csproj` pede pacote de infraestrutura, pare e revise a camada.
4. **Aplicar migration direto sem ler o SQL gerado** → sempre abra o arquivo de migration antes de rodar `database update`.
5. **Senha de banco commitada** → sempre confira `git status`/`git diff` antes do commit quando mexer em `appsettings*.json`.

## Exercício antes de codarmos juntos

Antes de eu revisar código com você, **tente sozinho**: escreva a classe `Student.cs` com Id, Name, Email, ProficiencyLevel (enum) e LearningStyle (enum), aplicando encapsulamento (setters privados + construtor). Não precisa estar perfeito — traga o que você fizer e eu reviso linha por linha com você.
