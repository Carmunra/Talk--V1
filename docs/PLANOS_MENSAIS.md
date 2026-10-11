# Planos mensais da Talkê

Valores definidos pelo operador em 11/10/2026:

| Aulas de 50 minutos por mês | Mensalidade |
| --------------------------- | ----------: |
| 4                           |      R$ 439 |
| 6                           |      R$ 569 |
| 8                           |      R$ 709 |
| 12                          |      R$ 969 |
| 16                          |    R$ 1.239 |

O operador escolheu renovação automática e uso com professores diferentes, com repasses automáticos pelo gateway. O catálogo está centralizado em src/domain/monthlyPlans.ts, publicado pelo servidor em /api/config e exibido na página inicial e em /planos. Valores são inteiros em centavos. Não foi criada cobrança, assinatura ou saldo fictício de aulas. subscriptionsEnabled permanece false; a interface informa que a contratação ainda não está disponível.

## Integração financeira pendente

Esta escolha muda o modelo anterior de pagamento individual por aula. A [configuração oficial do split 1:1](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/create-configuration) limita o produto a Checkout Pro, Checkout Transparente e Bricks. [Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/subscription-management) usa outra API. Não há suporte documentado para combinar a assinatura com o split 1:1 preparado. O [split 1:N](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/resources/split-payments-1-n) usa Orders/Checkout Transparente, participantes definidos por pagamento e habilitação comercial; não comprova repasse de uma assinatura a professores escolhidos depois.

Antes de implementar a contratação, selecionar uma solução homologada para cobrança recorrente e repasse automático conforme aulas concluídas. Confirmar disponibilidade comercial, recebedores e verificação cadastral, retenção/liberação dos recursos, tarifas, estornos e conciliação. Não assumir que marketplace_fee pode ser enviado à API de assinaturas nem anunciar um repasse realizado apenas por um lançamento no banco.

Definir o valor devido ao professor por aula, o destino das aulas não utilizadas, ciclo de validade e renovação, consumo/estorno de aulas, cancelamento, troca de plano, ausências e tratamento de chargebacks. A regra anterior de comissão de 15% por aula não foi convertida automaticamente em remuneração dos planos.

Após essas definições, implementar cobrança idempotente no servidor, confirmação de cada mensalidade pelo gateway, concessão e consumo atômicos de aulas por ciclo, reconciliação, cancelamento da recorrência e repasses auditáveis. Testar webhooks duplicados/atrasados, renovação recusada, concorrência de reservas, estorno e falha de repasse. A página de preços não comprova que esses fluxos já estão implementados.

## Documento comercial recebido

O PDF comercial fornecido pelo operador confirma a tabela Brasil acima. Sua página 3 registra 40% para o professor e 60% para a Talkê, com confirmação pendente da base e da aplicação a aulas realizadas/canceladas. Registra também retorno de crédito com pelo menos seis horas de antecedência, cobrança de 35% no cancelamento tardio e 50% na ausência, deixando bases, tolerância e crédito/devolução pendentes. Esses percentuais não foram ativados automaticamente. Aulas não usadas, prazo de reposição e meses com cinco semanas continuam sem regra confirmada. Os dados cadastrais já informados diretamente no chat completam os campos em branco do documento.

As outras tabelas do PDF (EUA e espanhol para inglês) têm ressalvas de moeda/correspondência ou valores divergentes e não foram aprovadas para este catálogo Brasil.

## Alternativa em avaliação

O [Asaas documenta split em assinaturas](https://docs.asaas.com/docs/split-em-assinaturas) com recebedores definidos em cada cobrança, além de [transferências por API entre contas vinculadas](https://docs.asaas.com/docs/transferencias). Para professores escolhidos depois da mensalidade, a possibilidade em avaliação é cobrança recorrente seguida de transferências automáticas conforme aulas concluídas. Isso é uma inferência arquitetural a homologar com o provedor, inclusive saldo disponível, tarifas, subcontas, prevenção de duplicidades e estornos. Não equivale a um split já liquidado nem autoriza abertura de conta, termos, chaves ou transferências reais. A escolha do gateway permanece com o operador.
