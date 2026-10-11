# Validação das correções — 11 de outubro de 2026

Verificação local da versão preparada para revisão. Dados de teste são fictícios; nenhuma cobrança real ou implantação remota foi executada.

| Verificação                                            | Resultado                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Unitários e integração, `npm run test:coverage`        | 97 testes aprovados; nenhuma falha ou teste ignorado                         |
| Cobertura de `src/server/**` nessa execução            | 91,08% de linhas; 86,95% de ramos; 93,05% de funções                         |
| Regras e transações, `npm run test:rules`              | 5 testes aprovados no emulador Firestore                                     |
| Navegador, `npm run test:e2e`                          | 8 cenários Cypress aprovados com Auth emulator; inclui navegação por teclado |
| Tipagem, `npm run lint`                                | Aprovada para aplicação, testes e scripts                                    |
| Produção, `npm run build` e `npm run verify:artifacts` | Compilação aprovada; cliente/servidor separados e helpers de teste ausentes  |
| Dependências, `npm audit --audit-level=moderate`       | Zero vulnerabilidades conhecidas na consulta realizada                       |
| Infraestrutura, Terraform validate/test                | Configuração válida; 3 testes de plano aprovados com provedor simulado       |
| Imagem de produção, `npm run test:container`           | Construção e execução incluídas no CI; consultar o resultado do commit       |
| Workflows, actionlint 1.7.12                           | Sintaxe e expressões aprovadas; download conferido por SHA256                |

## O que os testes demonstram

Complemento de configuração dos contatos e administradores, em 11/10/2026: nova execução local com **103 testes unitários/integrados aprovados**, cobertura do servidor de **91,12% de linhas, 87,07% de ramos e 93,05% de funções**, tipagem, compilação e separação de artefatos aprovadas. Foram adicionados testes de concessão por e-mail verificado, preservação de claims, rejeição de conta desativada/e-mail divergente e revogação mesmo em conta bloqueada. O cenário Cypress de privacidade também verifica os dois links de atendimento; consultar o CI da atualização para o resultado dessa nova asserção.

- Identidade forjada por cabeçalhos não autoriza operações; token inválido, e-mail não verificado e acesso entre contas são recusados. Retorno atrasado da sessão anterior não recoloca dados privados na interface após trocar de conta.
- Reservas concorrentes respeitam os intervalos do professor e do aluno. Repetição da mesma operação reutiliza a reserva; preço, comissão, duração e confirmação financeira são calculados e verificados no servidor.
- O gateway valida OAuth com PKCE e estado descartável, criptografia de credenciais, assinatura de webhook, contrato de preferência, consulta e reembolso. Aprovação duplicada, valor/conta/moeda/ambiente incorretos, aprovação tardia, reembolso parcial e chargeback não concedem acesso indevido.
- Responsáveis controlam dependentes. Adultos aguardam aferição de idade quando menores estão habilitados; professores aguardam aprovação. A retirada da autorização revoga acesso a reservas/sala, e os direitos de privacidade geram protocolos persistidos.
- Exclusão operacional remove cadastro e registros dispensáveis, mantém justificativa restrita para obrigações existentes e impede nova venda. Os testes não substituem a definição dos prazos de retenção e o expurgo operacional de backups.
- Salas exigem pagamento, participante autorizado e janela de tempo; salas públicas existentes são recusadas. Falha de encerramento fica em fila para nova tentativa e acompanhamento.
- A manutenção impede execuções sobrepostas, recupera travas expiradas e continua a fila após falhas individuais. Falha de persistência ou perda da trava não produz sucesso indevido nem sobrescreve o relatório de outra execução.
- A verificação de publicação recusa configuração incompleta, projetos divergentes e habilitação live com emuladores. Não imprime segredos. Os testes da infraestrutura recusam liberação sem aprovação e pagamentos sem referências dos segredos.
- Os testes de publicação automática simulam falhas antes/depois de promover tráfego, restauração do job e recuperação incompleta. A revisão candidata precisa passar nas verificações antes da promoção. Projetos, identidades e referências de segredos são validados sem exportar credenciais.
- Reservas usam o calendário de Brasília mesmo na virada de dia/ano UTC. O diálogo mantém foco, fecha com Escape e devolve foco ao botão que o abriu; o Cypress exerce esse comportamento no navegador.

Os testes unitários/integrados usam um banco em memória exclusivo de testes. O adaptador Firestore real é exercitado separadamente pelo emulador, incluindo concorrência e rollback; ele não é carregado no relatório de cobertura dos unitários. O servidor de produção não tem fallback em memória.

## Limites da evidência e próxima liberação

O Cypress autentica usuários no Firebase Auth emulado e usa um provedor financeiro controlado. Não valida a habilitação comercial do split, tarifas efetivas, PIX/cartão reais, reembolso com saldo insuficiente nem chamadas Daily em dispositivos reais. Esses casos precisam de homologação externa registrada em [PUBLICACAO.md](PUBLICACAO.md).

Os testes locais de publicação usam comandos simulados e não certificam permissões IAM, quota, domínio ou rollback na conta real. Consultar [PUBLICACAO_AUTOMATICA.md](PUBLICACAO_AUTOMATICA.md). Na execução local, uma edição de documentação reiniciou a página de desenvolvimento durante um cenário Cypress, que passou na repetição; o CI deve validar os arquivos estáveis antes da integração.

O build local e o CI usam configuração pública fictícia de Firebase. Não publicar esse artefato como configuração de produção. O Docker local está indisponível; a construção e execução da imagem são verificadas pelo CI, incluindo usuário sem privilégio, sistema de arquivos somente leitura, API protegida e ausência de fontes/testes/segredos no runtime.

O fluxo GitHub Actions executa as mesmas verificações. O resultado local não deve ser confundido com uma execução remota já concluída; consultar o status do commit no [PR de publicação](https://github.com/Carmunra/Talk--V1/pull/1). A proteção remota da branch está indisponível no plano atual para este repositório privado; a implantação das regras e da infraestrutura depende da conta real. Consultar [OPERACAO.md](OPERACAO.md).

Conformidade jurídica, idade/vínculo verificados, procedimentos de segurança de menores, contratos, obrigações fiscais, retenção, incidentes, fornecedores e restauração precisam ser aprovados e executados pelo operador. Consultar [PRIVACIDADE_OPERACAO.md](PRIVACIDADE_OPERACAO.md). As variáveis de aprovação apenas bloqueiam uma publicação acidental; não certificam conformidade.
