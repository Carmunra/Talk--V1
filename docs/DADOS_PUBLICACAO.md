# Dados fornecidos para a publicação

Atualizado em 11/10/2026. Este registro prepara a configuração; não comprova implantação, autorização jurídica ou criação de contas.

Razão social informada: 68.199.377 MARESSA SOARES LOPES. Domínio confirmado: talke.club; origem HTTPS https://talke.club.

Canal de privacidade/LGPD confirmado pelo operador: contato@talke.club. Esse endereço recebe solicitações de acesso, correção, exclusão e demais direitos de privacidade.

| Campo                                              | Valor informado                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| E-mail principal / administrador previsto          | contato@talke.club                                                                                                           |
| Suporte técnico — endereço corrigido pelo operador | jonathan.dantas@kriostech.com.br                                                                                             |
| Suporte adicional                                  | maressa6@outlook.com                                                                                                         |
| CNPJ                                               | 68.199.377/0001-55                                                                                                           |
| CNPJ na variável LEGAL_CNPJ                        | 68199377000155                                                                                                               |
| Provedor do DNS                                    | Hostinger; operador possui acesso                                                                                            |
| AWS                                                | Acesso confirmado; saldo estimado USD 1.100 verificado: Activate USD 1.000 até 31/10/2028 e Free Tier USD 100 até 06/10/2027 |
| Gateway escolhido                                  | Mercado Pago, Checkout Pro com split                                                                                         |
| Público pretendido                                 | Brasil, adultos e menores                                                                                                    |

## Pendências de definição e acesso

- Registros de conexão do site gerados pelo provedor de hospedagem escolhido. O acesso à Hostinger foi confirmado e o DNS de e-mail está validado.
- Projeto Firebase/Google Cloud de produção, faturamento e projeto separado para homologação.
- Cadastro e verificação dos dois administradores no projeto Firebase correto.
- Credenciais dos provedores em cofre, homologação real de pagamento/split e vídeo, documentos e procedimentos aprovados para menores.
- Assinaturas mensais: 4/6/8/12/16 aulas por R$ 439/569/709/969/1.239. Renovação automática, professores diferentes e repasses automáticos confirmados; solução financeira compatível, remuneração por aula e destino das aulas não usadas ainda pendentes. Consultar [Planos mensais](PLANOS_MENSAIS.md).

O operador escolheu AWS para a hospedagem, mantendo Firebase para login e banco. Seguir [Publicação AWS](PUBLICACAO_AWS.md). Não há recursos AWS criados ou plano aplicado; estimativa, orçamento e permissões precisam de revisão e aprovação. O crédito AWS não cobre Firebase/Google Cloud, Daily ou tarifas Mercado Pago. A lista Activate inclui os componentes AWS previstos.

## Configuração e acesso

Usar SUPPORT_EMAIL=jonathan.dantas@kriostech.com.br e SUPPORT_EMAIL_SECONDARY=maressa6@outlook.com. Ambos são canais públicos de atendimento; a configuração de contato não concede permissões.

Após cadastro e verificação do e-mail principal no projeto correto, um operador com credenciais administrativas deve executar:

```text
npm run admin:permissions -- --email contato@talke.club grant
npm run admin:permissions -- --email jonathan.dantas@kriostech.com.br grant
```

O script resolve o UID no Firebase, exige conta ativa com e-mail verificado para concessão, preserva outras claims e revoga sessões. O titular precisa entrar novamente. Para remover o acesso, usar a mesma chamada com revoke; a revogação também é permitida se a conta estiver desativada ou não verificada.

O operador autorizou administração completa para Jonathan, com os mesmos poderes do administrador principal. Não foi concedido acesso remoto a nenhum dos e-mails. Maressa é contato de suporte, sem autorização administrativa. Não colocar listas de e-mails administrativas no navegador nem conceder acesso por coincidência com o e-mail de suporte.

O repositório contém a configuração pública do projeto gen-lang-client-0335872674 e do banco ai-studio-talke-e7757877-77cd-4823-8492-1ea523e3d9bf. A existência desse arquivo não comprova acesso, faturamento ou autorização para usá-lo em produção. Confirmar titularidade, dados legados e separação da homologação antes de selecioná-lo.

Em 11/10/2026, o operador autorizou a consulta desse projeto e o acesso ao console foi confirmado. O console apresenta plano Spark (sem faturamento ativo) e aplicativos de outros sistemas no mesmo projeto. Não foram alterados recursos, faturamento, dados ou permissões. Preparar projetos exclusivos da Talkê para produção e homologação; os IDs reais dependem da criação e validação na conta.

O formulário de um novo projeto Talke Producao foi preparado; o operador autorizou desativar o Gemini e o controle foi desativado nesse formulário. O projeto ainda não foi criado, o Google Analytics permanece sem decisão e nenhuma cobrança foi ativada. A hospedagem AWS foi escolhida; criação dos projetos Firebase exclusivos permanece pendente.

O acesso à Hostinger foi confirmado e os quatro indicadores de DNS do e-mail ficaram verdes. Consultar [Validação do e-mail](DNS_EMAIL.md).

O procedimento de conexão do domínio está em [Domínio na Hostinger](DOMINIO_HOSTINGER.md).

Manter LEGAL_APPROVED, MINORS_SAFEGUARDS_APPROVED e PAYMENTS_HOMOLOGATED como false até a conclusão e aprovação dos respectivos requisitos. Não informar senhas ou chaves no chat.
