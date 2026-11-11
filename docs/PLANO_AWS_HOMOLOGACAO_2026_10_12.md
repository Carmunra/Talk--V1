# Plano de homologação AWS — 12/10/2026

Prévia real consultada na conta autenticada do operador, região São Paulo. Nenhuma criação, alteração ou exclusão de infraestrutura foi aplicada. O orçamento de US$ 60–100/mês já foi autorizado; permanece necessária a confirmação específica de novos acessos de segurança.

## Recursos previstos

Terraform validou a configuração e planejou **24 recursos novos, zero alterações e zero exclusões**, somente para `staging.talke.club`:

- Uma EC2 t3.small, disco gp3 cifrado de 20 GB, IP fixo e rede própria. Sem porta SSH; acesso externo somente HTTP/HTTPS. IMDSv2 obrigatório e CPU em modo standard, sem excedentes unlimited.
- Repositório ECR de imagens, cofre Secrets Manager sem valores de credenciais no plano, logs por 30 dias, métricas/alarmes e notificações.
- Função de execução `talke-staging-runtime`, assumida somente pela EC2, para ler o próprio cofre e imagem, emitir os próprios logs/métricas e usar Systems Manager.
- Função de publicação `talke-staging-github-deploy`, com sessões de até uma hora, assumida somente pelo repositório Carmunra/Talk--V1 na branch main. Pode publicar imagens no próprio ECR e administrar esse servidor por Systems Manager. Não administra IAM nem outros ambientes.
- Orçamento de alerta de US$ 100 para custos brutos da conta, sem descontar créditos, com aviso a 80% realizado e 100% previsto. Alertas operacionais são destinados a jonathan.dantas@kriostech.com.br; a inscrição SNS exige confirmação pelo destinatário.

O provedor OIDC GitHub ainda não existe. Sua criação é adicional aos 24 recursos: URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`. A função de publicação restringe a confiança ao repositório/branch acima.

**Poder do acesso:** publicar uma nova versão e executar comandos no servidor permite acesso indireto aos dados e credenciais que a aplicação utilizar nesse ambiente. A restrição ao ECR/SSM do ambiente não elimina esse poder. Administradores do repositório precisam proteger main e revisar workflows/dependências. Não serão criadas chaves permanentes do usuário raiz.

## Custo e limites

A estimativa documentada em [Hospedagem AWS](PUBLICACAO_AWS.md), consultada em 11/10/2026, fornece base de aproximadamente US$ 31,22/mês para uma instância/disco/IPv4 sempre ligados; produção e homologação juntas têm base de US$ 62,44. Logs, imagens, cofre, tráfego, backups, impostos e outros custos variáveis dependem do uso. A faixa autorizada de US$ 60–100 é orçamento de trabalho, sem garantia de teto de cobrança. Firebase/Google, Daily e Asaas têm custos separados.

Não foi criada a instância de produção. Ela exige plano próprio, dados/fornecedores aprovados e gates de lançamento. Créditos AWS não garantem cobertura de qualquer tarifa nem bloqueiam gasto excedente.

## Integridade e revisão

A AMI foi obtida no parâmetro público oficial e conferida com owner Amazon, x86_64, EBS e estado available. Caddy 2.11.7 foi consultado no registro oficial library/caddy; o digest foi verificado contra o SHA-256 do manifesto e a disponibilidade Linux amd64. O teste real de proxy no CI usa esse mesmo digest. [Release oficial Caddy](https://github.com/caddyserver/caddy/releases/tag/v2.11.7).

O pacote enviado ao CloudShell contém apenas infraestrutura e parâmetros da prévia, sem chaves. Sua integridade foi conferida antes da execução. Terraform 1.16.5 foi baixado do fornecedor oficial e verificado por SHA-256; provider AWS 6.68.0 foi instalado com o lockfile existente. A primeira instalação esgotou o limite de 1 GB do diretório persistente; a instalação foi concluída no armazenamento temporário disponível.

A prévia foi executada sem `apply` e sem salvar plano executável. O arquivo de parâmetros mantém `deployment_confirmed=false`; a opção true foi fornecida somente ao comando de planejamento para avaliar os recursos condicionados à aprovação. Isso não constitui autorização de aplicação. Após a aprovação de acesso, preparar estado cifrado com acesso restrito/bloqueio, gerar e revisar novo plano salvo e conferir seu conteúdo antes de aplicar. O provedor OIDC precisa existir antes da criação da função de publicação.

O relatório completo e os parâmetros da conta ficam em arquivos locais ignorados pelo Git. Este resumo não inclui credenciais ou valores de segredos.
