# Preparação de lançamento — 11/11/2026

Esta etapa ajusta a experiência e o vídeo da plataforma existente. Não registra implantação em nuvem, aprovação jurídica ou ativação de pagamentos reais. Os relatórios de outubro permanecem históricos; este documento registra a preparação mais recente.

## Entrega desta revisão

- Início por perfil com próxima aula, entrada no horário autorizado, saldo/primeira validade do aluno selecionado e ações pendentes. Responsável recebe orientação para selecionar o dependente.
- Etapas visíveis até a primeira aula: e-mail, cadastro/verificação, plano e agendamento. Professor acompanha aprovação e disponibilidade.
- Navegação principal curta, com áreas secundárias em Mais opções e acesso por teclado. Saldo, validades e confirmação da aula levam aos fluxos existentes.
- Planos mantidos: 4/6/8/12/16 aulas de 50 minutos por R$ 439/569/709/969/1.239. R$ 40 por aula concluída e confirmada, acúmulo por um ciclo e prazo de 60 dias após cancelar renovação preservados.
- Professor no modo mensal não recebe promessa de comissão de 15%, preço avulso ou conexão Mercado Pago. A área Repasses exibe sua própria situação de confirmação, processamento, revisão e conclusão, sem divulgar carteiras/credenciais nem simular saldo para saque.
- Administração reúne atalhos e contagens para segurança, financeiro, reembolsos, privacidade, idade, responsáveis, professores e encerramentos pendentes. As listas financeiras têm limite de 100 por tipo; o resumo não é um total irrestrito nem executa atendimento automaticamente.
- Google Meet manual selecionável em servidor, cliente, preflight e implantação. Sem dependência de credenciais Daily nesse modo. Link privado, exclusivo por aula e entregue apenas a participantes autorizados, dentro da janela. Consulte [procedimento e limites](VIDEO_GOOGLE_MEET.md).

## Evidência local

| Verificação                                              | Resultado desta revisão                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Unitários e integração                                   | 166 aprovados                                                                        |
| Cobertura do servidor                                    | 93,78% linhas; 91,09% ramos; 95,83% funções                                          |
| Firestore emulado                                        | 7 aprovados, incluindo negação do SDK e concorrência real para exclusividade de link |
| Cypress com Auth emulado                                 | 15 cenários aprovados, incluindo celular, professor e aluno no fluxo Meet            |
| Controlador AWS / host                                   | 6 testes Node e 13 Python aprovados                                                  |
| Tipagem                                                  | Aprovada                                                                             |
| Build, separação de artefatos e lockfile multiplataforma | Aprovados com configuração pública fictícia demo-talke                               |

A auditoria de dependências, Terraform e execução real de container/proxy devem ser conferidas no check Production readiness do commit incorporado. O build local usa configuração fictícia e não deve ser publicado como produção. Os testes locais de chamada usam URLs fictícias: não houve chamada real Google. Os testes financeiros controlados não validam renovação e condições comerciais Asaas em produção.

## Estado de publicação e trabalho externo pendente

1. **Firebase:** projetos exclusivos de homologação/produção, Auth/Firestore, região e faturamento quando necessário, regras/índices implantados, credencial dedicada no cofre e os dois administradores com e-mail verificado. Nenhuma dessas conclusões foi observada nesta revisão.
2. **AWS/domínio:** concluir o plano concreto de homologação, conferir AMI/custos atuais, provisionar e verificar servidor, cofre, alertas, domínio/HTTPS e recuperação. Orçamento de US$ 60–100/mês e conexão GitHub/duas funções de staging já foram autorizados. O provider OIDC foi criado em outubro; não há execução confirmada de Terraform apply ou publicação. A automação do navegador foi interrompida nesta revisão por não conseguir confirmar a URL com segurança; não foi tentado contornar o bloqueio.
3. **Asaas:** confirmar modelo comercial para recebimento da mensalidade e repasses posteriores por aula, contas/recebedores de produção, recorrência, webhook hospedado, reembolso/contestação, tarifas e reconciliação. O Sandbox já registrou transferência fictícia de R$ 40 como DONE e reembolso da cobrança fictícia; a antecipação/validação da cobrança futura retornou invalid_action. Não afirmar que a recorrência foi homologada.
4. **Regras e contratos:** aprovar ausência, cancelamento/reagendamento de aula, reposição, reembolso, tarifas e contestações, sem reintroduzir percentuais antigos dos PDFs. Não confundir essas decisões com os 60 dias já definidos após cancelar renovação. Validar também obrigações fiscais/MEI com o responsável contábil.
5. **LGPD/menores:** revisar e aprovar termos/privacidade, bases legais, retenção/expurgo, fornecedores/transferências, método de idade/vínculo, avaliação de professores, atendimento e incidentes. Preparar operação concreta; as variáveis de aprovação não executam esses procedimentos. Os dados do controlador e canais estão em [Dados da publicação](DADOS_PUBLICACAO.md).
6. **Vídeo e homologação final:** chamada real professor/aluno/responsável, admissão/encerramento Google, celular, fluxo integral no domínio de staging, isolamento entre contas, restauração e entrega de alertas. Só após homologar o mesmo commit registrar a aprovação para produção.

LEGAL_APPROVED, MINORS_SAFEGUARDS_APPROVED, PAYMENTS_HOMOLOGATED e ASAAS_PRODUCTION_APPROVED permanecem desabilitados na configuração pendente. Não publicar uma configuração demo, trocar os indicadores para contornar pendências ou anunciar o sistema como aberto apenas por haver código aprovado.
