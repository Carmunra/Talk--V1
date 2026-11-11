# Publicação automática e reversão

Alternativa Google Cloud. O operador selecionou AWS em 11/10/2026; seguir [Publicação AWS](PUBLICACAO_AWS.md) para o lançamento. Este workflow exige HOSTING_PROVIDER=google, além das demais aprovações; não executá-lo na seleção AWS.

O workflow Publish platform em .github/workflows/deploy.yml publica uma imagem testada em recursos Cloud Run já provisionados. A primeira ativação de projeto, faturamento, banco, identidades, segredos, regras e domínio segue OPERACAO.md. O workflow não cria esses recursos nem muda configurações jurídicas, financeiras ou permissões.

## Configuração

Usar dois projetos Firebase/Google Cloud separados para homologação e produção. A homologação usa Mercado Pago sandbox e dados fictícios. Os quatro valores públicos Firebase usados no build devem corresponder ao projeto do servidor.

Cadastrar estas variáveis do repositório GitHub, com prefixo STAGING_ e PRODUCTION_ para cada destino:

| Sufixo                         | Conteúdo                                               |
| ------------------------------ | ------------------------------------------------------ |
| GCP_PROJECT_ID                 | ID do projeto real                                     |
| GCP_REGION                     | Região, inicialmente southamerica-east1                |
| CLOUD_RUN_SERVICE              | Nome do serviço criado pelo Terraform                  |
| ARTIFACT_REPOSITORY            | Repositório Docker privado já criado                   |
| APP_ORIGIN                     | Origem HTTPS do destino, sem caminho/barra final       |
| GCP_WORKLOAD_IDENTITY_PROVIDER | Nome completo do provedor Workload Identity Federation |
| GCP_DEPLOY_SERVICE_ACCOUNT     | Identidade de publicação no mesmo projeto              |
| VITE_FIREBASE_API_KEY          | Chave pública Firebase da aplicação web                |
| VITE_FIREBASE_PROJECT_ID       | Mesmo ID de GCP_PROJECT_ID                             |
| VITE_FIREBASE_AUTH_DOMAIN      | Domínio de autenticação Firebase                       |
| VITE_FIREBASE_APP_ID           | ID da aplicação web Firebase                           |
| RELEASE_APPROVED               | true somente após revisão operacional do destino       |

PRODUCTION_STAGING_VALIDATED_SHA deve conter o SHA completo da main efetivamente homologado com os provedores financeiros e de vídeo selecionados, direitos de privacidade, proteção de menores quando habilitados, entrega de alertas e restauração. Essa variável registra uma decisão humana; não constitui prova ou certificação jurídica.

Os valores secretos continuam no Secret Manager, referenciados por versões numéricas no site e no job. As variáveis acima são configuração pública/operacional. Não incluir chaves privadas, tokens, JSON de conta de serviço ou segredos Mercado Pago no GitHub.

O fluxo usa variáveis com prefixo para funcionar sem depender dos ambientes/proteções pagos do GitHub. Enquanto main estiver sem proteção, administradores devem verificar o commit aprovado e controlar quem pode alterar workflow e variáveis. Se o plano permitir ambientes protegidos, migrar com revisão da condição OIDC correspondente.

## Identidade da publicação

Em cada projeto, criar uma identidade de publicação separada das identidades de runtime. Conceder somente Artifact Registry Writer no repositório de imagens, Cloud Run Developer nos recursos web/job e Service Account User nas duas identidades de runtime. Não conceder Owner, Editor, administração de IAM nem leitura dos valores dos segredos ao workflow. Confirmar permissões adicionais exigidas por políticas da organização durante a configuração real.

Criar provedor OIDC para https://token.actions.githubusercontent.com. Mapear google.subject para assertion.sub e restringir a condição ao repositório e proprietário por IDs, main e workflow exato. Para este repositório, a condição CEL é:

```text
assertion.repository_id == '1362993491' &&
assertion.repository_owner_id == '89612433' &&
assertion.ref == 'refs/heads/main' &&
assertion.workflow_ref == 'Carmunra/Talk--V1/.github/workflows/deploy.yml@refs/heads/main' &&
assertion.sub == 'repo:Carmunra/Talk--V1:ref:refs/heads/main'
```

Conceder roles/iam.workloadIdentityUser à identidade federada somente sobre a conta de publicação correspondente. Revisar IDs/condição se repositório, proprietário, caminho ou proteção por ambiente mudar. Sem essas restrições, outro workflow pode usar a identidade. A credencial temporária é obtida após o build e fica excluída do Git e da imagem.

Referências: [autenticação oficial do GitHub na Google Cloud](https://github.com/google-github-actions/auth), [configuração de federação para pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines) e [migração/reversão de tráfego Cloud Run](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration).

## Execução

1. Confirmar que o CI do SHA atual da main terminou com sucesso. Selecionar Publish platform, branch main e destino staging. Não executar a partir de outra branch.
2. O fluxo constrói com Firebase real, testa o container local, autentica por OIDC e envia a imagem ao Artifact Registry. A atualização usa o digest imutável.
3. A revisão candidata recebe uma URL temporária com zero tráfego principal. O fluxo verifica saúde, conexão ao banco, CSP e recusa de acesso sem sessão.
4. Após aprovação técnica, atualiza a imagem do job de manutenção e promove a revisão candidata a 100%. Verifica a origem HTTPS configurada e remove a URL temporária.
5. Executar e registrar a homologação externa. Preencher PRODUCTION_STAGING_VALIDATED_SHA com o commit validado e selecionar production.

O servidor e o job devem ter configuração financeira, banco e referências/versões dos segredos correspondentes. O fluxo recusa segredos inline, projeto divergente e tráfego já dividido entre revisões. Não executar Terraform ou outra publicação concorrente durante esse fluxo.

## Falha e reversão

Antes de atualizar o serviço, o fluxo grava um recibo com SHA, digest, revisão estável e imagem anterior do job, sem mapas de configuração ou segredos. O recibo final é anexado à execução do GitHub por 30 dias.

Falha na candidata preserva o tráfego principal e a imagem do job. Falha durante atualização do job ou promoção tenta restaurar ambos, inclusive quando o comando falha após uma alteração remota. RECOVERY_REQUIRED indica falha de recuperação e exige ação operacional imediata; consultar o recibo, restaurar a revisão/imagem anteriores e verificar saúde/manutenção.

Cancelamento manual, queda do runner ou expiração da credencial podem interromper a reversão automática. Não cancelar uma promoção em andamento; usar o recibo para confirmar estado real e concluir recuperação. O workflow nunca reverte banco, pagamentos, segredos ou aprovações; a imagem anterior precisa manter compatibilidade e controles de acesso.

Após sucesso, atualizar image_digest na configuração Terraform aprovada com o digest do recibo antes de um novo apply. Caso contrário, o próximo plano pode propor a imagem antiga. Manter o histórico dos recibos na documentação operacional.

Os testes locais simulam comandos e falhas; não comprovam IAM, domínio, quota ou homologação comercial. Essas evidências precisam ser obtidas nos projetos reais.
