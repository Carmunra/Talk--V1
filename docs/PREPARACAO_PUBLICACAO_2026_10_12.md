# Preparação da contratação e publicação — 12/10/2026

Atualização posterior: o operador aprovou os testes adicionais Sandbox, os 60 dias após cancelar renovação e a continuidade AWS na faixa de US$ 60–100/mês. Veja o [registro de continuidade](CONTINUIDADE_PUBLICACAO_2026_10_12.md) para a regra e os resultados atuais. Os pontos abaixo descrevem a etapa anterior.

Esta etapa complementa o [registro anterior](VALIDACAO_2026_10_12.md). Código preparado não equivale à liberação da plataforma ou à homologação de pagamentos reais. Nenhuma cobrança, subconta, transferência ou servidor de produção foi criado nesta etapa.

## Implementação concluída nesta etapa

- Compra do plano com valor do catálogo, aceite explícito da recorrência, cobrança hospedada no Asaas e chave de operação preservada em caso de erro. O navegador não recebe dados de cartão ou credenciais do provedor.
- Retomada de checkout próprio, apresentação de saldo/validade por ciclo e histórico de cobranças. Dados da conta anterior são descartados ao sair ou trocar de dependente.
- Reserva de aula usando um crédito, sem criar cobrança Mercado Pago. Professores com recebedor Asaas verificado podem aparecer no catálogo mesmo sem conexão Mercado Pago.
- Confirmação da realização pelo pagador/responsável e acompanhamento administrativo de recebedores, repasses e compras inconclusivas. Carteiras e chaves não são públicas. KYC e vínculo da subconta exigem conferência efetiva do administrador no Asaas; o formulário não substitui essa verificação.
- Cancelamento da renovação com confirmação e foco acessível. Duas políticas técnicas de saldo estão preparadas; o operador ainda precisa escolher qual corresponde aos termos aprovados. Nenhuma escolha foi presumida para produção.
- Eventos autenticados de cancelamento/expiração do checkout liberam apenas compras sem cobrança e não rebaixam assinaturas já vinculadas. Criação sem resposta conclusiva continua bloqueada para nova tentativa até conciliação.
- Adaptador live com origens fixas e credenciais por ambiente; sem reenvio automático de criação de checkout ou transferência após falha. Asaas Sandbox continua conectado; consulta de autenticação refeita com sucesso nesta etapa.
- Conciliação em páginas de até 100 registros com cursor persistente para percorrer todas as assinaturas, checkouts, eventos e repasses. Eventos antigos com falha não deixam os registros posteriores permanentemente sem atendimento; uma nova varredura revisita os anteriores. Paginação do adaptador Firestore validada no emulador, inclusive após remover o documento usado como cursor.
- Publicação AWS e alternativa Cloud Run aceitam somente referências protegidas de segredos Asaas e recusam cruzamento entre Sandbox em produção e live em staging.
- Verificação de lançamento mensal com `npm run publication:check -- --monthly`, cobrindo a liberação das assinaturas, aprovação comercial/financeira, regras e procedimentos para menores, além dos requisitos gerais.
- Avisos de termos/privacidade atualizados para assinatura, Asaas, AWS e confirmação da aula. Versão padrão de preparação: 2026-10-12. Textos continuam sujeitos à revisão e aprovação do controlador; não atribuem bases legais ou prazos de retenção ainda não definidos.

## Configuração segura

`SUBSCRIPTIONS_ENABLED=false` por padrão. Para staging, usar `ASAAS_ENVIRONMENT=sandbox` e exclusivamente `ASAAS_SANDBOX_API_KEY`, `ASAAS_SANDBOX_WEBHOOK_TOKEN` e `ASAAS_SANDBOX_ACCOUNT_ID`, em projeto Firebase exclusivo de homologação. O contêiner pode usar NODE_ENV=production mantendo chamadas financeiras exclusivamente Sandbox.

Para produção, usar `ASAAS_ENVIRONMENT=live` e os campos `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_ACCOUNT_ID` no cofre. Habilitar só depois de LEGAL_APPROVED, PAYMENTS_HOMOLOGATED, ASAAS_PRODUCTION_APPROVED e SUBSCRIPTION_RULES_APPROVED refletirem aprovações reais. Chaves com prefixo do ambiente errado, origem sem HTTPS ou Firebase emulado são recusadas.

`SUBSCRIPTION_CANCEL_CREDITS` precisa de escolha explícita antes de live:

| Valor técnico | Comportamento preparado |
| --- | --- |
| keep_until_expiry | Cancela próximas renovações e permite reservar aulas já pagas até a validade original; não cria novo lote nem estende o prazo. Exclusão de conta exige resolver saldo pago ainda válido. |
| block_booking | Cancela próximas renovações e bloqueia novas reservas; saldo e eventual reembolso precisam de atendimento. Este é apenas o padrão restritivo de preparação/teste. |

Cancelar a recorrência não presume estorno de cobranças já emitidas. Reposição, ausência, cancelamento de aula e prazo de contestação aguardam decisão; a interface encaminha essas situações ao suporte e não aplica automaticamente 35%/50% do documento anterior.

## Validação

155 testes unitários/integrados aprovados, com cobertura de linhas 93,47%, branches 90,43% e funções 95,76% na validação da paginação. Os 6 testes Firestore, 5 testes do controlador AWS, 13 testes Python do runtime, tipagem, build e verificação de separação cliente/servidor passaram localmente. A suíte Cypress passou os 13 cenários, incluindo professores somente por planos. Compra, saldo e painel administrativo foram inspecionados na prévia local com contas fictícias; evidências visuais ficam fora do Git. CI completo do commit final deve passar antes da integração.

Os novos fluxos de compra, histórico, cancelamento e reserva/confirmação passaram na primeira execução Cypress. Dois cenários antigos atingiram HTTP 429 pelo estado cumulativo dos limitadores da mesma conexão de teste. O executável de teste limpa seus próprios limitadores junto do banco de teste entre cenários; os limites de produção permanecem 180 requisições/minuto por IP e 90 por identidade. Não foram removidas verificações 401/403, capturas de falha ou tentativas de teste. A primeira execução dos testes de API sem acesso local e o Python MSYS também falharam por restrições do ambiente; os testes concluíram com o runtime adequado e apenas permissões de execução local necessárias.

Consulta externa somente de leitura em 12/10/2026: recebedor fictício PENDING, saldo fictício R$ 39,01 e mensalidade em CONFIRMED. Nenhuma transferência foi enviada. Preflight mensal da configuração pendente retorna ready=false por Firebase/Daily, aprovações jurídica/comercial/financeira, regras, proteção de menores e credenciais live ausentes.

## O que exige o operador/fornecedores

1. Autorização específica já solicitada para os testes adicionais no Asaas Sandbox: aprovar recebedor fictício, complementar R$ 5 fictícios, transferir R$ 40 fictícios, gerar a próxima cobrança fictícia e testar estorno/cancelamento. A revisão automática bloqueou aprovação/complemento porque excediam a autorização anterior. Não executar por outro meio para contornar o bloqueio.
2. Definir destino dos créditos ao cancelar, cancelamento/reposição/ausência, prazos de contestação, responsabilidade por tarifas/estornos e operação de suporte. Revisar contratos e enquadramento/faturamento fiscal com profissionais responsáveis.
3. Confirmar comercialmente com Asaas a operação de assinatura recebida pela Talkê e transferências a professores escolhidos depois, incluindo subcontas vinculadas, avaliação regulatória, limites, KYC, liquidação e aprovação da conta de produção. O teste não substitui essa confirmação.
4. Criar/autorizar projetos Firebase exclusivos, região/banco, credenciais restritas, faturamento necessário aos backups e concessão efetiva dos dois administradores verificados.
5. Disponibilizar conta e credenciais Daily, revisar condições e testar vídeo em dispositivos reais, incluindo responsável e encerramento da sala.
6. Aprovar custos e permissões da AWS com um plano concreto; provisionar, guardar segredos, publicar staging, configurar domínio/HTTPS, backups, recuperação e alertas. Crédito AWS não é limite automático de gasto e não cobre serviços externos.
7. Aprovar operação LGPD/menores: registro de tratamento, retenção/expurgo inclusive backups, fornecedores/transferências, métodos de idade/vínculo, verificação dos professores e resposta a direitos/incidentes. Flags continuam falsas enquanto pendente.
8. Homologar no ambiente hospedado o ciclo completo, entrega externa de webhooks, liquidação, repasse, cancelamento, estorno e restauração antes de habilitar produção.

## Referências primárias de integração

[API Keys e ambientes](https://docs.asaas.com/docs/api-keys), [prefixos de chave](https://docs.asaas.com/docs/padr%C3%A3o-de-chave-com-e-clientes-php), [checkout recorrente](https://docs.asaas.com/docs/checkout-com-assinatura-recorrente), [link hospedado](https://docs.asaas.com/docs/link-do-checkout-e-redirecionamento-do-cliente), [eventos de checkout](https://docs.asaas.com/docs/eventos-para-checkout), [transferências vinculadas](https://docs.asaas.com/reference/transferir-para-conta-asaas), [subcontas e avaliação regulatória](https://docs.asaas.com/docs/criacao-de-subcontas). Consulta em 12/10/2026; a confirmação do contrato específico continua pendente.
