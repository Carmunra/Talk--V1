# Continuidade da publicação — 12/10/2026

Este registro atualiza a [preparação anterior](PREPARACAO_PUBLICACAO_2026_10_12.md), que descreve a validação anterior às novas autorizações do operador. A plataforma ainda não foi publicada, e os pagamentos reais continuam desativados.

## Regra aprovada e implementação

O operador confirmou 60 dias para realizar aulas após cancelar a renovação. A política preparada é `SUBSCRIPTION_CANCEL_CREDITS=60_days_after_cancel`: o saldo pago e ainda válido recebe uma data limite fixa, calculada como a data do cancelamento em São Paulo mais 60 dias corridos. A realização/reserva deve ocorrer antes da data limite indicada na conta. Não há criação de créditos, recuperação de lotes vencidos ou reversão de estornos. O saldo consumido não muda.

A primeira confirmação de cancelamento grava a política e o prazo. Repetir a solicitação, conciliar novamente no provedor ou mudar a configuração não estende o prazo nem muda a regra já concedida. Cancelamento identificado diretamente no provedor recebe a mesma política, contando da primeira observação confirmada pelo sistema. A interface e os termos explicam os 60 dias, e a exclusão por LGPD exige resolver o saldo pago ainda válido.

As políticas técnicas anteriores permanecem disponíveis para compatibilidade de registros/testes. A configuração privada pendente foi ajustada para a regra aprovada, sem liberar cobrança real ou marcar aprovações jurídicas e comerciais como concluídas. Cancelamento de uma aula, ausência, reposição, contestação e reembolso exigem as decisões e validações já registradas.

## Testes externos autorizados — somente Asaas Sandbox

Foram usadas contas e valores fictícios. Não houve movimentação financeira de produção.

| Operação | Resultado observado |
| --- | --- |
| Aprovar a subconta fictícia do professor | APPROVED |
| Complementar R$ 5 fictícios | RECEIVED |
| Transferir R$ 40 fictícios para a carteira vinculada | Uma única criação aceita; autorização final feita pelo operador; transferência DONE |
| Gerar a mensalidade fictícia seguinte de R$ 439 | HTTP 400, invalid_action; renovação não homologada |
| Estornar a mensalidade fictícia de R$ 439 | REFUNDED |
| Cancelar a assinatura fictícia | Confirmado; deixou de aparecer como assinatura ativa do cliente |

A transferência foi aceita pelo provedor, mas a resposta possuía `account` sem `account.walletId`, com a carteira correta no campo principal `walletId`. O adaptador foi corrigido e a mesma transferência foi recuperada por consulta, verificando valor, referência e carteira. Não foi enviado um segundo POST. O operador concluiu a autorização de ação crítica no Sandbox, e a consulta posterior confirmou DONE. Os testes de regressão incluem esse formato e a remoção de dados pessoais da resposta.

Uma validação posterior da integração usou somente consultas externas, com um lote histórico e uma obrigação de repasse simulados em MemoryStore exclusivo de QA. A aplicação retirou os créditos diante do estorno real do Sandbox, reconheceu o repasse como DONE e preservou esses resultados em conciliações repetidas, sem mutações externas. Isso não valida entrega de webhooks públicos, renovação ou liquidação de mensalidade em produção.

O erro ao gerar a cobrança futura não foi tratado como sucesso nem provocou repetição automática. É necessário esclarecer a geração de mensalidades de cartão com o provedor e concluir a renovação em homologação. O cancelamento e o estorno realizados depois encerraram a assinatura fictícia desse cenário.

Chaves permanecem em arquivos locais protegidos e ignorados pelo Git. Evidências detalhadas e identificadores de contas fictícias permanecem no diretório local de testes. Não criar chaves root AWS nem expor credenciais em commits, relatórios ou capturas.

## AWS e bloqueios de lançamento

O operador autorizou continuar na faixa estimada de US$ 60–100 por mês. Essa autorização resolve o orçamento anterior; o próximo passo é conferir a conta e preparar um plano real de recursos, custos e permissões. O orçamento/alerta AWS não constitui limite automático de gasto, e serviços externos não são cobertos pelos créditos AWS.

O operador reconectou a AWS. Foram consultadas identidade, AMI oficial Amazon Linux 2023 x86_64 e ausência de instâncias, IPs reservados e repositórios ECR em São Paulo. A conta não possui provedor OIDC. A prévia Terraform real passou com 24 recursos a criar em homologação, sem alterações ou exclusões. Nenhum recurso desses foi criado. Veja o [plano para revisão de acesso](PLANO_AWS_HOMOLOGACAO_2026_10_12.md).

Continuam pendentes: confirmação comercial/regulatória Asaas para recebimento pela plataforma e repasses posteriores; conclusão da liquidação/transferência/renovação e webhooks hospedados; aprovação da conta de produção; projetos Firebase exclusivos e administradores verificados; Daily e testes de vídeo reais; validação jurídica/fiscal, contratos, operação LGPD/menores e políticas de reposição/ausência/reembolso; publicação em staging, HTTPS/domínio, backups e restauração.

## Validação desta alteração

Os 159 testes unitários e integrados, os 13 cenários Cypress, os 6 testes Firestore, a tipagem, o build com configuração fictícia e a separação dos artefatos cliente/servidor passaram localmente. Cobertura: 93,52% de linhas, 90,65% de branches e 95,79% de funções. A prévia Terraform real também passou. CI completo deve aprovar o commit final antes de integrar. As suítes não substituem homologação comercial, jurídica ou de produção.

## Referências de integração

[Aprovação fictícia de conta](https://docs.asaas.com/reference/aprovar-conta), [confirmação fictícia de pagamento](https://docs.asaas.com/reference/confirmar-pagamento), [transferências vinculadas](https://docs.asaas.com/reference/transferir-para-conta-asaas), [consulta de transferência](https://docs.asaas.com/reference/recuperar-uma-unica-transferencia), [geração de cobranças](https://docs.asaas.com/reference/gerar-carne-de-assinatura), [ações críticas no Sandbox](https://docs.asaas.com/docs/como-testar-a%C3%A7%C3%B5es-cr%C3%ADticas), [estorno](https://docs.asaas.com/reference/estornar-cobranca). Consulta em 12/10/2026.
