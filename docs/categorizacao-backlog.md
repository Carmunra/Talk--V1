# Categorização do backlog Talkê (TLK-1 a TLK-29)

**Critério escolhido:** camada técnica — reflete as próprias camadas da sua Clean Architecture (`Domain`, `Application`, `Infrastructure`, `Api`), então categorizar assim também reforça o modelo mental da arquitetura.

## Taxonomia proposta

| Categoria | O que entra aqui |
|---|---|
| **Decisão de Negócio** | Escolhas que não são código, mas afetam o produto (hosting, monetização, fornecedores) |
| **DevOps/Infra** | Repositório, ambientes, CI/CD, domínio, deploy |
| **Banco de Dados** | Modelagem, EF Core, migrations |
| **Backend** | Regras de negócio, use cases, validações (Domain/Application) |
| **API** | Contratos, controllers, endpoints (Api) |
| **Frontend** | Telas, componentes React |
| **Segurança** | Autenticação/autorização |
| **QA/Testes** | Testes automatizados |
| **Observabilidade** | Logging, monitoramento, analytics/eventos |
| **Produto** | User stories "guarda-chuva" (o quê o usuário ganha), sem camada técnica única |

Essa lista de valores ainda não existe no seu campo "Categorias" do Jira (apareceu "Nenhum resultado encontrado") — você precisa criá-los lá antes de aplicar. Se conectar o Jira (Atlassian Rovo), eu crio e aplico direto.

## Sprint 1 — Fundação (TLK-1 a TLK-14)

| ID | Tarefa | Categoria |
|---|---|---|
| TLK-1 | Decisão: hospedagem AWS vs Azure | Decisão de Negócio |
| TLK-2 | Modelo de pagamento e comissão | Decisão de Negócio |
| TLK-3 | Provedor de e-mail transacional | Decisão de Negócio |
| TLK-4 | Modelagem de dados (ERD) | Banco de Dados |
| TLK-5 | Contrato de API (OpenAPI/Swagger) | API |
| TLK-6 | Setup do repositório e estratégia de branching | DevOps/Infra |
| TLK-7 | Setup do backend .NET | Backend |
| TLK-8 | Setup do frontend React | Frontend |
| TLK-9 | Setup PostgreSQL + EF Core | Banco de Dados |
| TLK-10 | Ambientes (dev/staging/produção) e secrets | DevOps/Infra |
| TLK-11 | Pipeline de CI/CD | DevOps/Infra |
| TLK-12 | Domínio e SSL | DevOps/Infra |
| TLK-13 | Monitoramento e logging | Observabilidade |
| TLK-14 | Ferramenta de analytics/eventos | Observabilidade |

## Sprint 2 — Autenticação (TLK-15 a TLK-23)

| ID | Tarefa | Categoria |
|---|---|---|
| TLK-15 | (story) Criar conta como aluno ou professor | Produto |
| TLK-16 | API de cadastro com validações | API |
| TLK-17 | Tela de cadastro (/register) | Frontend |
| TLK-18 | (story) Confirmar e-mail para ativar conta | Produto |
| TLK-19 | (story) Fazer login com e-mail e senha | Produto |
| TLK-20 | Tela de login | Frontend |
| TLK-21 | Recuperação de senha | Backend |
| TLK-22 | Autorização por perfil | Segurança |
| TLK-23 | Testes automatizados do fluxo de autenticação | QA/Testes |

## Sprint 3 — Diagnóstico (TLK-24 a TLK-29)

| ID | Tarefa | Categoria |
|---|---|---|
| TLK-24 | (story) Responder um diagnóstico inicial | Produto |
| TLK-25 | Modelagem de diagnóstico | Banco de Dados |
| TLK-26 | API de diagnóstico | API |
| TLK-27 | Tela de diagnóstico (/student/diagnostic) | Frontend |
| TLK-28 | Validações obrigatórias | Backend |
| TLK-29 | Eventos de tracking | Observabilidade |

## Sobre o dashboard ao vivo

Nenhum serviço está conectado nesta sessão ainda — não é o ClickUp, é o **Jira**. Sem conexão, não dá pra puxar dado real e manter "ao vivo". Sugeri o conector **Atlassian Rovo** (Jira + Confluence) na conversa — assim que você conectar, eu:

1. Crio os valores de categoria no campo do Jira e aplico em cada issue automaticamente (em vez de você copiar manualmente desta tabela).
2. Monto um dashboard (artifact) que consulta o Jira ao vivo — contagem por categoria, por status, por responsável, prazos estourados — e atualiza sempre que você reabrir.

Sem conexão, esta tabela é o que você aplica manualmente por enquanto.
