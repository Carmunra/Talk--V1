# Validação das correções — 8 de outubro de 2026

Verificação local da versão preparada para revisão. Dados de teste são fictícios; nenhuma cobrança real ou implantação remota foi executada.

| Verificação                                            | Resultado                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| Unitários e integração, `npm run test:coverage`        | 81 testes aprovados; nenhuma falha ou teste ignorado                        |
| Cobertura de `src/server/**` nessa execução            | 90,21% de linhas; 85,14% de ramos; 94,02% de funções                        |
| Regras e transações, `npm run test:rules`              | 5 testes aprovados no emulador Firestore                                    |
| Navegador, `npm run test:e2e`                          | 7 cenários Cypress aprovados com Auth emulator                              |
| Tipagem, `npm run lint`                                | Aprovada para aplicação, testes e scripts                                   |
| Produção, `npm run build` e `npm run verify:artifacts` | Compilação aprovada; cliente/servidor separados e helpers de teste ausentes |
| Dependências, `npm audit --audit-level=moderate`       | Zero vulnerabilidades conhecidas na consulta realizada                      |

## O que os testes demonstram

- Identidade forjada por cabeçalhos não autoriza operações; token inválido, e-mail não verificado e acesso entre contas são recusados. Retorno atrasado da sessão anterior não recoloca dados privados na interface após trocar de conta.
- Reservas concorrentes respeitam os intervalos do professor e do aluno. Repetição da mesma operação reutiliza a reserva; preço, comissão, duração e confirmação financeira são calculados e verificados no servidor.
- O gateway valida OAuth com PKCE e estado descartável, criptografia de credenciais, assinatura de webhook, contrato de preferência, consulta e reembolso. Aprovação duplicada, valor/conta/moeda/ambiente incorretos, aprovação tardia, reembolso parcial e chargeback não concedem acesso indevido.
- Responsáveis controlam dependentes. Adultos aguardam aferição de idade quando menores estão habilitados; professores aguardam aprovação. A retirada da autorização revoga acesso a reservas/sala, e os direitos de privacidade geram protocolos persistidos.
- Exclusão operacional remove cadastro e registros dispensáveis, mantém justificativa restrita para obrigações existentes e impede nova venda. Os testes não substituem a definição dos prazos de retenção e o expurgo operacional de backups.
- Salas exigem pagamento, participante autorizado e janela de tempo; salas públicas existentes são recusadas. Falha de encerramento fica em fila para nova tentativa e acompanhamento.

Os testes unitários/integrados usam um banco em memória exclusivo de testes. O adaptador Firestore real é exercitado separadamente pelo emulador, incluindo concorrência e rollback; ele não é carregado no relatório de cobertura dos unitários. O servidor de produção não tem fallback em memória.

## Limites da evidência e próxima liberação

O Cypress autentica usuários no Firebase Auth emulado e usa um provedor financeiro controlado. Não valida a habilitação comercial do split, tarifas efetivas, PIX/cartão reais, reembolso com saldo insuficiente nem chamadas Daily em dispositivos reais. Esses casos precisam de homologação externa registrada em [PUBLICACAO.md](PUBLICACAO.md).

O build local e o CI usam configuração pública fictícia de Firebase. Não publicar esse artefato como configuração de produção. O Dockerfile foi preparado, mas a imagem não foi construída nesta validação.

O fluxo GitHub Actions executa as mesmas verificações. O resultado local não deve ser confundido com uma execução remota já concluída; consultar o status do commit no GitHub. A proteção remota da branch e a implantação das regras não foram alteradas.

Conformidade jurídica, idade/vínculo verificados, procedimentos de segurança de menores, contratos, obrigações fiscais, retenção, incidentes, fornecedores e restauração precisam ser aprovados e executados pelo operador. Consultar [PRIVACIDADE_OPERACAO.md](PRIVACIDADE_OPERACAO.md). As variáveis de aprovação apenas bloqueiam uma publicação acidental; não certificam conformidade.
