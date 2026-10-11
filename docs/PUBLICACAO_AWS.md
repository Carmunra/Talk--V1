# Hospedagem AWS da Talkê

Escolha confirmada pelo operador em 11/10/2026: hospedar na AWS e manter Firebase Authentication/Firestore. A consulta autorizada ao console confirmou US$ 1.100 estimados disponíveis: US$ 1.000 AWS Activate FOUNDERS até 31/10/2028 e US$ 100 AWS Free Tier até 06/10/2027, sem uso exibido. O saldo é estimado e pode levar cerca de 24 horas para refletir consumo; não equivale a um limite de gastos.

A lista de serviços do crédito Activate inclui EC2, VPC, ECR, Secrets Manager, CloudWatch, Systems Manager, SNS e Budgets, componentes deste plano. As tarifas específicas devem ser confrontadas com as condições do crédito e a fatura. Firebase/Google Cloud, Daily e Mercado Pago têm contas e cobranças separadas.

## Estrutura preparada

- Uma EC2 t3.small por ambiente, Amazon Linux 2023 oficial x86_64, em São Paulo (sa-east-1). Produção e homologação têm instâncias, repositórios, segredos e projetos Firebase separados; podem usar a mesma conta AWS.
- IP público fixo para o registro A na Hostinger. DNS de e-mail preservado. Caddy oficial pelo digest, HTTPS automático e administração do proxy somente dentro do container. O host prepara uma imagem derivada que copia o mesmo binário para retirar sua capability de arquivo; a construção não acessa a rede. O proxy continua sem privilégios, cap-drop=ALL e no-new-privileges, nas portas internas 8080/8443.
- Aplicação Node sem privilégios, sistema de arquivos somente leitura e porta de acesso local/privada. Credenciais em Secrets Manager, carregadas em /run após boot; nenhum valor secreto no Terraform, imagem, GitHub ou relatório.
- Acesso administrativo por Systems Manager; nenhuma chave SSH, porta 22 ou chave AWS permanente para o workflow. IMDSv2 obrigatório, hop limit 1 e bloqueio adicional do endereço de metadata para containers.
- Releases por imagem imutável e versão imutável do segredo, com testes antes de enviar tráfego, verificação real de TLS/banco/API privada, rollback e registro de recuperação após reinicialização.
- Reconciliação de pagamentos e encerramento de salas a cada cinco minutos, com exclusão mútua no host e a trava existente no Firestore. Monitoramento acusa falha de prontidão, de execução recente da manutenção ou da instância.
- OIDC do GitHub limitado ao repositório Carmunra/Talk--V1 e main. A função de publicação escreve somente no ECR do ambiente e executa comandos no servidor daquele ambiente; não lê o segredo nem administra IAM ou provisiona infraestrutura.

Esta arquitetura inicial usa uma única zona/instância por ambiente. Uma falha do host pode interromper o serviço; ainda é necessário homologar capacidade, recuperação e tempo de indisponibilidade tolerado. O workflow tem poder administrativo sobre seu servidor via SSM; administradores do repositório e da conta controlam esse acesso. A conta consultada está autenticada como raiz e apresenta MFA; não gerar chaves permanentes de usuário raiz.

## Custos e aprovação antes de ativar

Estimativa consultada em 11/10/2026 na [calculadora AWS](https://calculator.aws/), região São Paulo, Linux compartilhado sob demanda, sem reservas e com produção e homologação ligadas por 730 horas mensais:

| Componente | Cálculo | US$/mês |
| --- | --- | ---: |
| Duas EC2 t3.small | 2 × 730 h × US$ 0,0336/h | 49,06 |
| Dois discos gp3 de 20 GB | 40 GB × US$ 0,152/GB-mês | 6,08 |
| Dois IPv4 públicos | 2 × 730 h × US$ 0,005/h | 7,30 |
| Base de servidores, discos e IPs | Soma arredondada | **62,44** |

O preço IPv4 está na [tabela oficial VPC](https://aws.amazon.com/vpc/pricing/). A calculadora de EC2 exibiu US$ 55,14 para servidores e discos; o IPv4 foi calculado separadamente. Secrets Manager, armazenamento de imagens ECR, logs de 30 dias, métricas/alarmes, transferência de dados, backups e impostos não estão nessa base. Os custos variáveis dependem de uso ainda não medido. Um orçamento inicial proposto de **US$ 100/mês** reserva US$ 37,56 acima da base para os demais componentes AWS; é uma proposta pendente, não uma cotação completa ou garantia. Firebase/Google Cloud, Daily e Mercado Pago ficam fora desse orçamento AWS.

Não há plano aplicado, servidor criado ou cobranças iniciadas por esta preparação. Antes de criar recursos, aprovar o orçamento, confirmar a estimativa dos componentes variáveis e revisar o plano real na conta. Homologação ligada também consome crédito; interromper a EC2 não elimina custos de discos e IPs reservados. Nenhuma compra de Savings Plans ou reservas foi realizada.

O módulo exige monthly_budget_usd informado e deployment_confirmed=true após revisão de recursos, custos e acesso. Os alertas previstos medem custos brutos da conta AWS, sem descontar créditos/reembolsos, e notificam o contato operacional aprovado a 80% do realizado e 100% do previsto. São alertas, não bloqueios de cobrança. Aprovar o destinatário e confirmar a inscrição SNS. Não comprar Savings Plans, assinaturas ou outras reservas como parte deste procedimento.

## Preparação das contas

1. Criar projetos Firebase exclusivos da Talkê para homologação e produção. Definir a região do Firestore conscientemente antes da criação. O projeto legado gen-lang-client-0335872674 é compartilhado com outros sistemas e não foi selecionado para esta implantação.
2. Ativar Authentication e cadastrar a aplicação web. Implantar as regras e índices já existentes somente no projeto explícito escolhido. Autorizar o domínio de cada ambiente.
3. Criar conta de serviço dedicada ao backend com datastore.user e as permissões Firebase Auth estritamente usadas pelo servidor (firebaseauth.users.get/update). Não usar Owner/Editor ou chave da conta compartilhada. A chave privada exige autorização específica, armazenamento em cofre, rotação e revogação; não inserir no chat.
4. A autenticação Google fora do Google Cloud é uma pendência de homologação. O runtime AWS preparado usa uma chave Firebase em Secrets Manager, como caminho documentado pelo SDK. Workload Identity Federation deve ser validada separadamente com o Firebase Admin SDK antes de substituir essa chave; não presumir compatibilidade.
5. Registrar configuração e credenciais dos provedores no cofre. O operador precisa concluir homologação de split, estorno, webhook e vídeo; aprovações jurídicas, de menores e de pagamento continuam false até a conclusão dos requisitos.
6. Definir e testar backup/restauração do Firestore. Backups gerenciados exigem faturamento Google/Blaze; o crédito AWS não cobre isso. A aplicação não armazena o banco de dados no disco EC2, e snapshot do servidor não substitui backup do Firestore.

## Provisionamento revisável

O módulo está em infra/aws. Fixar account_id, ami_id oficial revisada, environment, domain, proxy_image pelo digest e orçamento; nunca inserir valores de segredos em tfvars. O provider está fixado e verificado para Windows/Linux. Usar estados Terraform separados e armazenamento cifrado com controle de acesso e bloqueio.

O provider OIDC GitHub deve existir na conta com audience sts.amazonaws.com; criação/alteração dessa confiança precisa de aprovação de acesso específica. Não reutilizar nem substituir outro provider sem revisão. O plano cria funções, redes e cofre apenas da Talkê, não altera usuários existentes.

Executar init, plan com arquivo salvo e revisar a lista completa antes de apply. Não remover prevent_destroy para contornar alterações que proponham excluir a instância, IP, imagem ou cofre. Atualizações do controlador do host/AMI exigem procedimento de infraestrutura aprovado; mudar user_data força substituição, que fica bloqueada pela proteção.

Após criação, inspecionar a conclusão de cloud-init e Systems Manager antes de executar a publicação. Copiar public_ip, instance_id, repository_url, runtime_secret_arn e deploy_role_arn das saídas verificadas. Não publicar o domínio antes de confirmar o IP alocado na conta.

## Formato do segredo

Inserir o valor diretamente no cofre, fora do Terraform e Git. O formato JSON tem dois campos:

```json
{
  "environment": {
    "APP_ORIGIN": "https://talke.club",
    "FIREBASE_PROJECT_ID": "ID_REAL_DO_PROJETO",
    "LEGAL_NAME": "68.199.377 MARESSA SOARES LOPES",
    "LEGAL_CNPJ": "68199377000155",
    "PRIVACY_EMAIL": "contato@talke.club",
    "SUPPORT_EMAIL": "jonathan.dantas@kriostech.com.br",
    "SUPPORT_EMAIL_SECONDARY": "maressa6@outlook.com",
    "LEGAL_APPROVED": "false",
    "MINORS_ENABLED": "false",
    "MINORS_SAFEGUARDS_APPROVED": "false",
    "PAYMENTS_ENABLED": "false",
    "PAYMENTS_HOMOLOGATED": "false"
  },
  "firebaseServiceAccount": {}
}
```

Este exemplo incompleto não inicia produção. Preencher as configurações restantes de .env.example e a credencial dedicada aprovada. O controlador rejeita variáveis desconhecidas, emuladores, injeção de linhas, projeto divergente, credencial de outro projeto e imagem cliente de outro projeto. NODE_ENV, PORT, TRUST_PROXY_HOPS e GOOGLE_APPLICATION_CREDENTIALS são definidos pelo controlador. O segredo é recuperado por VersionId fixado; não usar AWSCURRENT no workflow.

## Publicação e recuperação

Configurar HOSTING_PROVIDER=aws nas variáveis do repositório apenas após provisionar os ambientes. O workflow Google exige HOSTING_PROVIDER=google e fica inativo na seleção AWS. Não implantar firebase.hosting.json para esta rota.

Para cada prefixo STAGING_ ou PRODUCTION_, configurar AWS_ACCOUNT_ID, AWS_DEPLOY_ROLE, AWS_INSTANCE_ID, AWS_ECR_REPOSITORY, AWS_SECRET_VERSION_ID, APP_ORIGIN e as quatro VITE_FIREBASE_* públicas reais. AWS_RELEASE_APPROVED=true depende da aprovação concreta do ambiente. A função AWS assumida deve ter exatamente o nome talke-staging-github-deploy ou talke-production-github-deploy, na conta indicada.

Executar Publish AWS platform em staging depois do CI aprovado no mesmo commit main. O fluxo exige scan ECR completo sem achados HIGH/CRITICAL, imagem testada e recibo do host correspondente. Homologar login, reserva, provedores e recuperação no domínio de staging. Registrar PRODUCTION_STAGING_VALIDATED_SHA somente após validar esse commit; produção exige o mesmo SHA.

O primeiro certificado depende do DNS correto e do desafio ACME nas portas 80/443. Uma implantação sem HTTPS ou Firestore acessível falha sem ser anunciada como publicada. Falha no candidato mantém a versão anterior; falha após troca tenta restaurar o proxy e a versão anterior. Se a recuperação falhar, pending.json permanece e a manutenção fica bloqueada para impedir execução com configuração incerta.

O recibo não contém credenciais. Em resultado SSM desconhecido, examinar o comando existente e o journal antes de tentar novamente. Para recuperação de interrupção usar python3 /opt/talke/runtime.py restore pelo acesso SSM autorizado; ele restaura a versão anterior registrada no journal ou remove uma primeira publicação incompleta. Para retorno intencional a uma versão anterior, revisar previous.json e executar release com o digest e VersionId anteriores, sem editar manualmente current.json. Não apagar o journal para aparentar sucesso.

Confirmar /api/ready, API privada 401 sem sessão, CSP, Cache-Control, manutenção bem-sucedida, inscrição dos alertas e DNS/TLS antes da abertura ao público. Os testes em CI simulam a infraestrutura e exercitam o proxy em Docker; não substituem a implantação/homologação real na conta.

Referências: [EC2 preços](https://aws.amazon.com/ec2/pricing/on-demand/), [IPv4 público](https://aws.amazon.com/vpc/pricing/), [limites dos alertas](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html), [autenticação Google/GitHub e aviso Firebase SDK](https://github.com/google-github-actions/auth), [preço e backups Firestore](https://firebase.google.com/docs/firestore/pricing), [HTTPS Caddy](https://caddyserver.com/docs/automatic-https).
