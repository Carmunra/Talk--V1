# Planos mensais da Talkê

Atualização em 12/10/2026: o operador adotou Talke_Catalogo_A4_Horizontal_v4.pdf como referência comercial, exceto pelos preços, e reconfirmou R$ 40 por aula concluída. Os nomes são Essencial, Evolução, Constância, Intensivo e Intensivo Conversação, na ordem dos cinco planos. A apresentação e o contato para aula experimental manual pelo WhatsApp foram alinhados ao catálogo. A conta Sandbox agora está conectada; consultar [a validação atual](VALIDACAO_2026_10_12.md), que distingue autenticação, pagamento confirmado e repasse efetivamente executado. Contratação real continua bloqueada.

Valores definidos pelo operador em 11/10/2026:

| Aulas de 50 minutos por mês | Mensalidade |
| --------------------------- | ----------: |
| 4                           |      R$ 439 |
| 6                           |      R$ 569 |
| 8                           |      R$ 709 |
| 12                          |      R$ 969 |
| 16                          |    R$ 1.239 |

O operador escolheu renovação automática, professores diferentes, repasses automáticos pelo gateway e acúmulo das aulas não usadas por mais um ciclo mensal. O catálogo está centralizado em src/domain/monthlyPlans.ts, publicado pelo servidor em /api/config e exibido na página inicial e em /planos. Valores são inteiros em centavos. O backend de homologação Asaas foi preparado e está conectado à conta Sandbox com dados fictícios. subscriptionsEnabled permanece false; a interface informa que a contratação ainda não está disponível.

## Repasse dos planos confirmado

Em 11/10/2026, o operador confirmou R$ 40 por aula concluída de 50 minutos para todos os cinco planos mensais. Na futura integração, esse valor deve ser representado por 4.000 centavos e vinculado ao professor que realizou cada aula, independentemente do preço do plano ou de outros professores escolhidos pelo aluno. Esta regra substitui a proposta percentual de 40%/60% do PDF para os planos mensais.

| Aulas por mês | Mensalidade | Repasse se todas forem concluídas | Restante antes das demais despesas |
| ------------: | ----------: | --------------------------------: | ---------------------------------: |
|             4 |      R$ 439 |                            R$ 160 |                             R$ 279 |
|             6 |      R$ 569 |                            R$ 240 |                             R$ 329 |
|             8 |      R$ 709 |                            R$ 320 |                             R$ 389 |
|            12 |      R$ 969 |                            R$ 480 |                             R$ 489 |
|            16 |    R$ 1.239 |                            R$ 640 |                             R$ 599 |

O restante não é lucro: ainda inclui tarifas do gateway, tributos, infraestrutura e demais despesas. O exemplo enviado pelo operador para quatro aulas estima R$ 100 de outras despesas e, sob essa hipótese, R$ 179 de resultado (40,8% da mensalidade). A estimativa não foi validada como custo real nem estendida aos outros planos.

Repasse de aulas canceladas, ausências, prazo de liquidação e responsabilidade pelas tarifas continuam pendentes. A regra de 4.000 centavos foi implementada no backend exclusivo de homologação; nenhum repasse ou obrigação financeira foi criado em conta ou banco reais. A cobrança avulsa existente mantém sua configuração própria de 15% para a plataforma e não foi alterada por esta confirmação dos planos.

## Validade das aulas confirmada

Aulas não usadas podem ser realizadas até o fim do ciclo mensal seguinte. O lote mantém seu vencimento original quando ocorre uma renovação; não há acúmulo ilimitado. Os lotes mais próximos do vencimento são consumidos primeiro e a data agendada deve estar dentro da validade. O calendário usa America/Sao_Paulo, com âncora no primeiro vencimento e ajuste para o último dia em meses mais curtos; a âncora original é preservada nos meses seguintes. Exemplo: lote com início em 31/01/2026 vence em 31/03/2026; lote de 28/02/2026 da mesma assinatura vence em 30/04/2026. A validade não depende de inventar uma mensalidade paga quando a renovação é recusada.

## Integração financeira pendente

Esta escolha muda o modelo anterior de pagamento individual por aula. A [configuração oficial do split 1:1](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/create-configuration) limita o produto a Checkout Pro, Checkout Transparente e Bricks. [Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/subscription-management) usa outra API. Não há suporte documentado para combinar a assinatura com o split 1:1 preparado. O [split 1:N](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/resources/split-payments-1-n) usa Orders/Checkout Transparente, participantes definidos por pagamento e habilitação comercial; não comprova repasse de uma assinatura a professores escolhidos depois.

Antes de implementar a contratação, selecionar uma solução homologada para cobrança recorrente e repasse automático conforme aulas concluídas. Confirmar disponibilidade comercial, recebedores e verificação cadastral, retenção/liberação dos recursos, tarifas, estornos e conciliação. Não assumir que marketplace_fee pode ser enviado à API de assinaturas nem anunciar um repasse realizado apenas por um lançamento no banco.

O valor devido por aula concluída e o acúmulo por um ciclo estão confirmados acima. O operador autorizou preparar o Asaas. Definir reposição/estorno por cancelamento e ausência, mudança de plano, créditos após cancelamento da recorrência, conclusão/contestação e tratamento financeiro de chargebacks. A regra anterior de comissão de 15% por aula avulsa não foi convertida automaticamente em remuneração dos planos.

O backend de homologação prepara checkout recorrente hospedado, confirmação de cada cobrança consultada no Asaas, concessão e consumo atômicos por lote, conciliação de renovações, cancelamento da recorrência e repasses auditáveis. Os testes usam um gateway controlado. Falha de resposta de checkout/transferência não autoriza repetir o POST: externalReference serve para correlação e não foi tratado como garantia de idempotência do provedor. Consultar [Homologação Asaas](ASAAS_HOMOLOGACAO.md) para os controles, procedimentos e limitações. Produção e contratação pública continuam bloqueadas.

## Documento comercial recebido

O PDF comercial fornecido pelo operador confirma a tabela Brasil acima. A proposta de 40% para o professor e 60% para a Talkê da página 3 foi substituída pela confirmação posterior de R$ 40 por aula concluída nos planos mensais. O documento registra também retorno de crédito com pelo menos seis horas de antecedência, cobrança de 35% no cancelamento tardio e 50% na ausência, deixando bases, tolerância e crédito/devolução pendentes. Esses percentuais de cancelamento e ausência não foram ativados automaticamente. O acúmulo por um ciclo foi confirmado depois; reposição por cancelamento continua pendente. A quantidade é mensal, sem promessa de aulas extras em meses com cinco semanas. Os dados cadastrais já informados diretamente no chat completam os campos em branco do documento.

As outras tabelas do PDF (EUA e espanhol para inglês) têm ressalvas de moeda/correspondência ou valores divergentes e não foram aprovadas para este catálogo Brasil.

## Asaas selecionado para preparação

O operador autorizou preparar a integração com Asaas. O [checkout recorrente](https://docs.asaas.com/docs/checkout-com-assinatura-recorrente) recebe o cartão na página hospedada pelo provedor. Para professores escolhidos depois da mensalidade, o backend preparado usa cobrança recorrente seguida de [transferência entre contas vinculadas](https://docs.asaas.com/docs/transferencias), com R$ 40 por aula concluída e saldo disponível. Essa arquitetura precisa de homologação comercial e técnica, inclusive tarifas, subcontas, liquidação, estornos, contestação e critério de conclusão. Não equivale a um split da mensalidade liquidado no pagamento. A autorização foi para preparar o código; não foram abertas contas, aceitos termos, criadas chaves ou realizadas transferências reais.
