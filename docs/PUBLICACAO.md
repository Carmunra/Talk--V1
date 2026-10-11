# Publicação comercial — Brasil

## O que mudou

A identidade é verificada com Firebase Admin, inclusive revogação de sessão. O navegador não lê/escreve diretamente no Firestore. Reservas e pagamentos têm dono, valores calculados no servidor e transações atômicas. Foram substituídos o saldo inicial fictício, o processamento de cartões e os saques simulados.

O pagamento ocorre por aula no Checkout Pro, com credencial OAuth do professor e marketplace_fee de 15%. A parcela de 85% mostrada pela aplicação é anterior às tarifas do Mercado Pago; não representa saldo disponível para saque. Não há promessa de escrow nem liberação financeira condicionada à conclusão de aula.

A sala Daily é privada, com token individual, janela de tempo e confirmação de pagamento. Os painéis de progresso usam registros de aulas reais, sem notas ou métricas demonstrativas. As telas do piloto foram substituídas para retirar seleção de identidade e resultados fictícios.

## Preparação e implantação

Para atualizações de ambientes já provisionados, seguir [Publicação automática e reversão](PUBLICACAO_AUTOMATICA.md).

1. Usar projetos Firebase distintos para desenvolvimento, homologação e produção. Habilitar Google Auth e domínio autorizado. Configurar banco, região e backups. Usar IAM mínimo e identidade do serviço, evitando arquivos de chave no repositório.
2. Copiar .env.example para desenvolvimento e preencher a configuração pública web e as variáveis do servidor. Nunca incluir segredos em VITE_ ou no código do navegador. O build exige os quatro valores públicos VITE_FIREBASE_*; o projeto deve corresponder ao projeto do servidor.
3. Aprovar documentos, controlador, contatos, idade mínima, procedimento de aferição de idade e proteção de menores. Ler PRIVACIDADE_OPERACAO.md. LEGAL_APPROVED e MINORS_SAFEGUARDS_APPROVED são declarações do operador após executar os requisitos; não executam a validação jurídica.
4. Configurar Mercado Pago em sandbox, PKCE S256, URL OAuth exata APP_ORIGIN/api/payments/oauth/callback e webhook payment em APP_ORIGIN/api/payments/webhook. Gerar chave TOKEN_ENCRYPTION_KEY com 32 bytes aleatórios em base64 e guardar em cofre, com recuperação e rotação planejadas.
5. Habilitar OAuth para cada professor, verificar elegibilidade da conta para split e aprovar o perfil após análise. A troca de conta recebedora exige migração com suporte; o token expirado exige reconexão explícita. Não há renovação automática silenciosa.
6. Configurar DAILY_API_KEY e DAILY_DOMAIN, revisar contrato/região e restrições de gravação. Homologar vídeo em dispositivos reais e com responsável acompanhando a aula do menor.
7. Executar npm ci, lint, testes, regras, Cypress, build e verificação dos artefatos. Configurar HTTPS e APP_ORIGIN exato. Publicar somente dist/client como arquivos públicos; dist/server não pode ficar em pasta estática.
8. Implantar firestore.rules e storage.rules restritivas com a CLI oficial e o projeto explicitamente selecionado. Nenhuma implantação remota foi executada nesta correção. Fazer backup e testar a mudança em homologação antes de produção.
9. Conceder custom claim admin somente a contas verificadas, com conta operacional protegida por MFA e acesso restrito. O script scripts/set-admin.ts aceita UID grant|revoke ou --email EMAIL grant|revoke, resolve a conta no Firebase, preserva outras claims e revoga sessões. Não usa lista automática de e-mails nem cabeçalhos do cliente. Os contatos fornecidos e pendências estão em [Dados da publicação](DADOS_PUBLICACAO.md).
10. Configurar reconciliação periódica: npm run payments:reconcile, em job único com identidade do serviço. Uma execução sobre pedido específico aceita o identificador como argumento. Alertar falhas do job, tokens expirados, reembolsos REQUIRES_SUPPORT, filas abertas e divergências financeiras.
11. Estabelecer monitoramento, limites de custo, proteção de borda e backups com teste de restauração. /api/health é liveness; /api/ready verifica acesso ao banco. Os limites locais da API precisam de controle de borda para múltiplas instâncias. O servidor não confia em X-Forwarded-For por padrão.
12. Habilitar ambiente live apenas após homologação externa e reconciliação dos dados legados. PAYMENTS_HOMOLOGATED=true é obrigatório para pagamentos live em NODE_ENV=production. Separar credenciais e chaves sandbox/live.

## Homologação Mercado Pago pendente

Os testes automáticos usam um gateway controlado e verificam contrato HTTP, assinatura, estado e valores. Eles não provam que a aplicação Mercado Pago foi habilitada comercialmente. Antes de habilitar live, registrar evidências de:

- OAuth/PKCE e reconexão da mesma conta; professor não elegível, autorização revogada e token expirado.
- Preferência com preço correto, marketplace_fee, collector_id, referência e URLs HTTPS.
- PIX e cartão aprovados, pendentes, recusados, abandono e retorno sem aprovação.
- Webhook real válido, repetido, atrasado e ausente; recuperação por reconciliação.
- Cancelamento antes/após pagamento, pagamento duplicado, aprovação após expiração, reembolso integral/parcial, falta de saldo do vendedor e chargeback.
- Identificação das tarifas e parcelas de professor/plataforma no painel e relatórios do provedor.

O split 1:1 pode limitar reembolso integral se o vendedor não tiver saldo. A equipe precisa de procedimento financeiro para essa situação; o aplicativo registra REQUIRES_SUPPORT e não afirma que o valor já foi devolvido. Referência: [integração split Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace).

## Contratos, atendimento e obrigações financeiras

Antes da venda, aprovar a oferta e os contratos de aluno/responsável, professor e plataforma: preço final, tarifas, cancelamento, ausência, reagendamento, indisponibilidade e atendimento. Validar com assessoria jurídica os direitos do consumidor e a política de devolução aplicável à contratação digital; a ação de cancelamento no aplicativo não substitui essa avaliação.

Validar com contabilidade o modelo de intermediação, a emissão de documentos fiscais, tributação, obrigações de cada parte e conciliação de tarifas. O aplicativo registra pedidos e pagamentos; não emite nota fiscal nem calcula obrigações tributárias. Definir responsáveis por suporte, contestação, reembolso sem saldo do vendedor e incidentes com menores, com prazos, escala e evidências de atendimento.

## Dados legados e continuidade

As antigas reservas, pagamentos “PAID” e carteiras foram gerados por fluxos permissivos. Não converter esses estados em crédito real. Fazer inventário e confronto com extratos do provedor, separar demonstrações de registros legítimos e documentar a migração. A nova versão exige cadastro ligado ao UID verificado; registros antigos sem perfil/vínculo não são automaticamente assumidos por outro usuário.

Inventariar e encerrar também salas Daily antigas que tenham sido criadas como públicas e verificar eventuais gravações. A versão nova não reabre essas salas. O cancelamento, a suspensão e a retirada de autorização solicitam encerramento ao provedor; falhas ficam em room_closures e devem ser alertadas e repetidas pela manutenção.

Definir RPO/RTO, retenção/expurgo, plano de reversão compatível com regras restritivas e operação de atendimento. Não reabrir as regras antigas para restaurar o piloto. Testar capacidade e limites em homologação antes de aumentar escala.

## Comandos

A preparação técnica adicional de hospedagem, manutenção, backups, incidentes e proteção do repositório está em [OPERACAO.md](OPERACAO.md). O registro técnico de tratamentos, com campos jurídicos pendentes, está em [REGISTRO_TRATAMENTO.csv](REGISTRO_TRATAMENTO.csv).

- npm run dev — desenvolvimento com .env.
- npm run publication:check — verifica configurações e aprovação antes da publicação, sem revelar segredos ou acessar a nuvem.
- npm run test:container — verifica a imagem de produção no Docker; executado também no CI.
- npm run test:coverage — unitários/integrados e cobertura mínima.
- npm run test:rules — emulador Firestore; Java 21 necessário.
- npm run test:e2e — Auth emulator + Cypress, sem dados ou pagamentos reais.
- npm run build e npm run verify:artifacts — artefatos separados, sem mapa de código ou helpers de teste.
- npm start — servidor compilado; variáveis fornecidas pela hospedagem.
- npm run payments:reconcile — manutenção financeira com acesso Admin e credenciais do ambiente selecionado.

CI usa somente configuração pública fictícia do projeto demo-talke. Configure branch protection para exigir o job Production readiness; a configuração remota de proteção da branch permanece a cargo do administrador do repositório.
