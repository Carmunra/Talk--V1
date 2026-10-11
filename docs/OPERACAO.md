# Preparação técnica e operação

## Entrega técnica

A configuração em infra/cloud-run prepara Cloud Run na região de São Paulo, identidades separadas para site/manutenção/agendador, acesso restrito aos segredos, manutenção a cada cinco minutos, backup diário e alertas de indisponibilidade/falha financeira. Ela referencia um Firebase/Firestore existente e segredos já provisionados. Não cria documentos jurídicos, domínio, contas dos fornecedores nem o banco de dados.

Os testes Terraform usam provedor simulado: verificam o plano e seus bloqueios sem criar recursos ou gerar cobranças. Validar o plano não comprova permissões, quotas, domínio, entrega de alertas ou restauração no ambiente real. A configuração permanece bloqueada enquanto faltarem dados/aprovações e deployment_confirmed estiver false.

A configuração usa Google Cloud para aproveitar o Firebase já adotado. Pode ser adaptada a outra hospedagem capaz de executar a imagem Docker. Custos e faturamento da conta dependem do operador. A revisão inicia com limite de uma instância; ampliar exige proteção de borda e teste de capacidade. Definir orçamento e alertas de custo antes da implantação.

## Ativação

Após provisionar o ambiente, seguir [PUBLICACAO_AUTOMATICA.md](PUBLICACAO_AUTOMATICA.md) para configurar a identidade temporária do GitHub, publicar revisões testadas e acompanhar reversões.

1. Criar/selecionar projetos isolados de homologação e produção, habilitar faturamento, Firebase Auth/Google e Firestore. Aprovar região, fornecedores, contatos, retenção e documentos. Provisionar um repositório privado de imagens no Artifact Registry.
2. Criar os quatro segredos referenciados no exemplo diretamente no Secret Manager, com versões numéricas e recuperação segura da chave de criptografia. Não colocar seus valores no Terraform, GitHub, imagens, logs ou variáveis públicas VITE_.
3. Preencher a configuração pública Firebase e a configuração operacional aprovada em ambiente seguro. Construir a imagem com os quatro argumentos VITE_FIREBASE_*, usando exatamente o projeto do servidor. Executar npm run publication:check após npm run build: o relatório lista pendências sem imprimir credenciais e não acessa a nuvem.
4. Copiar terraform.tfvars.example para terraform.tfvars e preencher os valores reais, prazo de backup aprovado e digest imutável da imagem testada. Confirmar versões dos segredos e contato de alerta. Usar estado remoto criptografado, com IAM restrito e histórico; o estado local do Terraform não deve ser compartilhado ou commitado.
5. Executar terraform init, validate e plan. Ler os recursos e permissões propostos, completar deployment_confirmed apenas após a revisão e aplicar no projeto de homologação. O banco é existente; não substituí-lo nem importar dados demonstrativos sem análise. A conta de aplicação recebe leitura/atualização de usuários Auth para revogação; a concessão de administrador continua sendo uma tarefa separada.
6. Configurar origem HTTPS, DNS/roteamento e domínios autorizados do Firebase. O módulo não configura domínio customizado ou balanceador; verificar as opções e disponibilidade regional do provedor. Revisar APP_ORIGIN no servidor e as URLs exatas de OAuth/webhook do Mercado Pago.
7. Implantar firestore.rules/storage.rules selecionando o projeto explicitamente. Verificar no ambiente real que o navegador não consegue ler/escrever as coleções privadas e que o servidor tem somente as permissões necessárias.
8. Executar homologação Mercado Pago/Daily, conferir job/agendamento e provar entrega de alertas no contato operacional. O status de manutenção aparece na fila administrativa. Repetir os testes de restauração descritos abaixo e registrar evidências. Só então aplicar a imagem/configuração aprovadas em produção.

Referências oficiais: [containers Cloud Run](https://docs.cloud.google.com/run/docs/deploying), [agendamento de jobs](https://docs.cloud.google.com/run/docs/execute/jobs-on-schedule) e [backups Firestore](https://docs.cloud.google.com/firestore/native/docs/backups).

## Manutenção e alertas

Executar npm run payments:reconcile por agendamento. O job adquire uma trava de 30 minutos, renovada antes de cada operação. Execuções sobrepostas saem como SKIPPED; a trava expirada pode ser recuperada após falha/interrupção. Falhas individuais de sala/pedido são registradas e o restante da fila continua. O resultado FAILED retorna código de saída 1, inclusive quando não é possível persistir o relatório.

A consulta de pedidos é paginada. Pedidos recentes pendentes, pagos, cancelados, em reembolso ou revisão parcial são consultados; disputas são acompanhadas mesmo antigas. A janela de consulta financeira de 180 dias não é prazo de retenção jurídica. Volume elevado exige revisar seleção de pedidos, duração e limites do provedor antes de ampliar escala.

Os eventos estruturados maintenance_failed, reconciliation_failed e room_closure_failed incluem somente identificadores técnicos, sem nomes, emails, credenciais ou corpos do provedor. Configurar retenção/acesso dos logs conforme matriz aprovada. Um job morto por timeout pode deixar estado RUNNING e trava até expirar; alertas de falha de execução e acompanhamento da última execução são necessários. Confirmar que a manutenção ocorre a cada cinco minutos e investigar ausência por mais de uma janela operacional.

Ao receber alerta: confirmar o projeto, verificar o último job, indisponibilidade do banco/provedor, expiração do OAuth e filas de reembolso/encerramento. Reconectar o professor quando necessário. Reexecutar a manutenção após corrigir a causa, mantendo os identificadores e a idempotência. Não marcar reembolso como concluído sem confirmação do provedor.

## Restauração e dados excluídos

1. Escolher um backup e restaurá-lo em banco/projeto isolado, com acesso externo bloqueado e sem credenciais de pagamentos live. Medir o tempo de restauração e a perda de dados frente ao RPO/RTO aprovados.
2. Comparar contagens, integridade de reservas/pagamentos e registros de exclusão/retirada de autorização posteriores ao backup. Confrontar alterações financeiras posteriores com o provedor.
3. Reaplicar exclusões e restrições posteriores ao backup antes de permitir qualquer acesso. Remover conteúdo dispensável e preservar somente obrigações justificadas; contas excluídas/suspensas não podem recuperar acesso por restauração. Manter o registro atualizado de exclusões fora do backup restaurado, com proteção e retenção aprovadas.
4. Provar exportação, isolamento entre contas, sessões revogadas, ausência de perfil público excluído e tratamento financeiro correto. Só promover o banco após aprovação e evidências. O módulo agenda backups; essa verificação precisa ocorrer na conta real.

## Resposta a incidente e reversão

Registrar descoberta, alcance, sistemas, responsáveis e linha do tempo com acesso restrito. Conter o incidente suspendendo o acesso afetado, encerrando salas, bloqueando credenciais comprometidas e preservando evidências necessárias. Rotacionar segredos e revisar IAM; planejar rotação da chave de criptografia com recuperação das credenciais já cifradas, evitando perda de capacidade de reembolso.

Avaliar obrigações de comunicação com o responsável jurídico/privacidade e executar os prazos aplicáveis. Não publicar dados de menores em tickets ou logs. Informar titulares pelo canal aprovado e registrar o atendimento. Referência jurídica e contatos devem ser completados em PRIVACIDADE_OPERACAO.md.

Para reverter uma implantação, promover uma imagem/revisão anterior validada que mantenha autenticação e regras restritivas. Não retornar ao piloto permissivo. Preservar compatibilidade do banco, pedidos e credenciais; após reversão, repetir saúde, login, isolamento, reconciliação e salas.

## Proteção do repositório

O GitHub retornou HTTP 403 ao consultar proteção da branch deste repositório privado: o plano atual exige upgrade para disponibilizar o recurso. Os checks automatizados verificam o PR, mas não impedem um push direto enquanto essa proteção estiver indisponível. A privacidade do repositório foi preservada.

Quando o plano permitir, exigir o check Production readiness/checks na branch main, bloquear exclusão/force push e aplicar a regra também aos administradores. Até lá, manter o fluxo de revisão por PR e verificar manualmente o commit aprovado antes de incorporar/publicar.
