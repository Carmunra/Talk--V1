# Conectar talke.club

Origem confirmada pelo operador: https://talke.club. O DNS continuará na Hostinger.

## Rota AWS escolhida

O operador selecionou AWS em 11/10/2026. A configuração infra/aws prepara uma EC2 com Elastic IP em São Paulo e proxy Caddy para o site e API. Após provisionamento aprovado e verificado, substituir somente o A do domínio raiz pelo public_ip da saída Terraform. Nesta etapa o domínio público da aplicação é talke.club; publicação e redirecionamento de www devem ser homologados separadamente.

Antes da alteração, salvar a zona e confirmar servidor/SSM, imagem, segredo e aprovações da plataforma. Não há IP AWS alocado ou mudança do A até agora. Não usar endereço de exemplo, IP temporário ou IP Cloud Run. Preservar MX, SPF, DKIM, DMARC, autodiscover e autoconfig validados em [E-mail](DNS_EMAIL.md).

O certificado depende do DNS correto e do desafio ACME nas portas 80/443. Não contornar erro de certificado. Autorizar talke.club no Firebase Authentication; manter APP_ORIGIN=https://talke.club, configuração pública do mesmo projeto e callbacks Mercado Pago previstos abaixo. Validar HTTPS, prontidão, login e provedores antes de liberar o público. Seguir [Publicação AWS](PUBLICACAO_AWS.md); não implantar firebase.hosting.json nesta rota.

## Alternativa Google Cloud, não selecionada

A configuração firebase.hosting.json encaminha todas as rotas, inclusive arquivos do cliente e API, ao serviço Cloud Run talke em southamerica-east1. O diretório público está vazio para que o cliente e a API sejam servidos pela mesma revisão. O fluxo existente continua atualizando a revisão principal do Cloud Run; a configuração não fixa uma tag.

Firebase Hosting permite encaminhamento para Cloud Run em São Paulo. O mapeamento direto de domínio do Cloud Run não está disponível nessa região; o Hosting fornece a conexão do domínio e certificado. Referências: [Hosting com Cloud Run](https://firebase.google.com/docs/hosting/cloud-run) e [domínios Cloud Run](https://docs.cloud.google.com/run/docs/mapping-custom-domains).

Esta configuração ainda não foi implantada nem homologada no provedor. Não publica regras de banco ou arquivos de servidor como conteúdo estático. Se o nome/região do serviço provisionado for diferente, ajustar o arquivo antes da implantação.

## Ativação da alternativa Google Cloud

1. Conectar a conta Google/Firebase e confirmar o projeto de produção e seu faturamento. Provisionar o serviço com a configuração real aprovada; manter homologação em projeto separado.
2. Confirmar que o Cloud Run responde com os controles de autenticação previstos. Implantar somente Hosting, usando firebase.hosting.json e --project com o ID real explicitamente selecionado. Conceder ao operador apenas as permissões necessárias; a identidade do workflow de imagens não recebe acesso ao Hosting automaticamente.
3. No Firebase Console, abrir Hosting, adicionar talke.club e copiar os registros de verificação e conexão fornecidos para esse projeto.
4. Na Hostinger, abrir Domínios → DNS → talke.club. Salvar uma cópia da zona atual. Inserir o TXT de verificação e os registros A/AAAA ou CNAME exatamente como apresentados pelo Firebase; revisar conflitos existentes para o mesmo nome. Manter os registros de e-mail MX, SPF, DKIM e DMARC.
5. Aguardar a validação de propriedade, a propagação dos registros e a emissão do certificado. O Firebase informa que o certificado pode levar até 24 horas após o apontamento; não há garantia de ativação no mesmo dia.
6. Autorizar talke.club no Firebase Authentication. Configurar APP_ORIGIN=https://talke.club no serviço e job. A configuração pública web deve usar o mesmo projeto; não trocar authDomain sem configurar a autorização correspondente.
7. Configurar Mercado Pago com retorno https://talke.club/api/payments/oauth/callback e webhook https://talke.club/api/payments/webhook.
8. Validar no domínio: HTTPS, /api/health, /api/ready, API privada com resposta 401 sem sessão, CSP, Cache-Control: no-store em dados privados, login/logout, reserva e homologação dos provedores.

Os valores específicos de DNS dependem do projeto conectado. Não substituir registros por IPs estimados nem apontar o domínio para um endereço temporário sem validação.

## Consulta pública antes da mudança

Em 11/10/2026 às 18:37 UTC: NS byte.dns-parking.com e pixel.dns-parking.com; registro A 2.57.91.91; MX mx1.hostinger.com (prioridade 5) e mx2.hostinger.com (prioridade 10); TXT SPF v=spf1 include:_spf.mail.hostinger.com ~all. A consulta não encontrou AAAA ou CAA no domínio raiz. Nenhum registro foi alterado. Essa consulta não substitui a cópia da zona no painel; registros DKIM/DMARC e subdomínios precisam ser preservados conforme a zona real.

Referências: [domínio personalizado Firebase](https://firebase.google.com/docs/hosting/custom-domain), [DNS da Hostinger](https://www.hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger/).
