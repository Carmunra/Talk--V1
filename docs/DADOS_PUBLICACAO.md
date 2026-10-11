# Dados fornecidos para a publicação

Atualizado em 11/10/2026. Este registro prepara a configuração; não comprova implantação, autorização jurídica ou criação de contas.

Razão social informada: 68.199.377 MARESSA SOARES LOPES. Domínio confirmado: talke.club; origem HTTPS https://talke.club.

| Campo                                              | Valor informado                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| E-mail principal / administrador previsto          | contato@talke.club                                                                                                        |
| Suporte técnico — endereço corrigido pelo operador | jonathan.dantas@kriostech.com.br                                                                                          |
| Suporte adicional                                  | maressa6@outlook.com                                                                                                      |
| CNPJ                                               | 68.199.377/0001-55                                                                                                        |
| CNPJ na variável LEGAL_CNPJ                        | 68199377000155                                                                                                            |
| Provedor do DNS                                    | Hostinger; operador possui acesso                                                                                         |
| AWS                                                | Operador possui acesso e informou crédito de USD 1.100; elegibilidade, saldo, validade e restrições ainda não verificados |
| Gateway escolhido                                  | Mercado Pago, Checkout Pro com split                                                                                      |
| Público pretendido                                 | Brasil, adultos e menores                                                                                                 |

## Pendências de definição e acesso

- Canal específico de privacidade/LGPD.
- Acesso autenticado à zona de DNS da Hostinger e registros gerados pelo provedor de hospedagem.
- Projeto Firebase/Google Cloud de produção, faturamento e projeto separado para homologação.
- Cadastro e verificação dos dois administradores no projeto Firebase correto.
- Credenciais dos provedores em cofre, homologação real de pagamento/split e vídeo, documentos e procedimentos aprovados para menores.

O plano de implantação existente usa Google Cloud Run e Firebase. Não há recursos AWS criados nem migração aprovada. O crédito AWS informado não é aplicado automaticamente a serviços Google Cloud/Firebase.

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

O procedimento de conexão do domínio está em [Domínio na Hostinger](DOMINIO_HOSTINGER.md).

Manter LEGAL_APPROVED, MINORS_SAFEGUARDS_APPROVED e PAYMENTS_HOMOLOGATED como false até a conclusão e aprovação dos respectivos requisitos. Não informar senhas ou chaves no chat.
