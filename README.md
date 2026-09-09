# Talkê 🗣️

Plataforma inteligente de ensino de idiomas conectando alunos e professores com diagnóstico automatizado de proficiência (CEFR), agendamento flexível de aulas particulares e carteira de créditos.

## 🚀 Arquitetura e Migração

O projeto foi migrado com sucesso para **Node.js 22 + TypeScript + Express + React (Vite)** mantendo os princípios de **Clean Architecture**:

- **Talke.Domain**: Entidades `Student`, `Teacher`, `Lesson`, `CreditWallet`, `CreditPackage`, `TeacherRecommendation` e enums de proficiência e estilos de aprendizagem.
- **Talke.Application**: Lógica de diagnóstico avaliativo de proficiência (A1 a C2), matching de professores e regras de dedução e estorno de créditos.
- **Talke.Infrastructure**: Datastore em memória inicializado com dados realistas, com suporte a extensões futuras (PostgreSQL / Cloud SQL).
- **Talke.Api**: Servidor Express rodando na porta 3000 com roteamento unificado, middleware Vite e documentação OpenAPI interativa.

---

## 💻 Como Rodar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Build para produção
npm run build

# Iniciar servidor em produção
npm start
```

---

## 📡 Endpoints da API

- `GET /weatherforecast` — Endpoint de compatibilidade do template .NET WebAPI original
- `GET /api/health` — Status e metadados das camadas arquiteturais
- `GET /api/students` — Listagem e detalhes dos alunos
- `POST /api/students` — Cadastro de novo aluno
- `GET /api/teachers` — Listagem de professores aprovados (filtros por nível e estilo)
- `POST /api/teachers` — Cadastro de professor
- `GET /api/diagnostics/questions` — Perguntas do questionário de diagnóstico
- `POST /api/diagnostics/evaluate` — Avaliação e cálculo de nível (CEFR) e estilo
- `GET /api/recommendations/:studentId` — Recomendações personalizadas de professores
- `GET /api/lessons` — Listagem de aulas agendadas e histórico
- `POST /api/lessons` — Agendamento de aula (com validação e débito de créditos)
- `PATCH /api/lessons/:id/status` — Conclusão ou cancelamento (com estorno de créditos)
- `GET /api/credits/packages` — Pacotes de créditos disponíveis
- `POST /api/credits/buy` — Compra de créditos para carteira do aluno
