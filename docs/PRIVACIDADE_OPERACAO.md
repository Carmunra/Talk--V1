# LGPD, menores e atendimento — requisitos de operação

Este documento acompanha os controles implementados. O software não certifica conformidade jurídica nem substitui o procedimento de proteção de menores. Não habilite os indicadores de aprovação sem completar e registrar os requisitos abaixo.

## Identificação e documentos

Preencher razão social, CNPJ, canal do titular, canal de suporte e responsável pelo atendimento. Aprovar os textos publicados em /privacidade e /termos, incluindo bases legais, retenção efetiva, fornecedores, países/regiões de processamento e mecanismos de transferência internacional. A versão do documento deve mudar quando houver alterações materiais, sem exigir novo aceite para o titular exercer seus direitos.

Manter registro de operações: finalidade, categorias, titulares, base legal aplicável, acesso, compartilhamento, retenção, risco e medida de proteção. O consentimento não é a base única para todas as operações. As hipóteses dos arts. 7º e 11 da LGPD precisam ser avaliadas com prevalência do melhor interesse de crianças/adolescentes. Referência: [Enunciado ANPD nº 1/2023](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes).

## Menores e aferição de idade

O lançamento adota dependentes gerenciados pelo responsável; não há conta autônoma de criança. Quando MINORS_ENABLED=true, o cadastro de adultos também aguarda aferição de idade, para impedir que a autodeclaração de maioridade libere acesso automaticamente. A equipe registra referência da verificação; o sistema não considera uma caixa de seleção como prova de idade ou vínculo.

Antes de aprovar: definir método confiável e proporcional de aferição de idade de todas as contas, comprovação de responsabilidade, treinamento dos revisores, regra de recusa/recurso e proteção dos documentos de evidência fora dos campos de texto do aplicativo. A aprovação deve referenciar evidência efetivamente verificada, com acesso e retenção restritos. Não coletar documento ou biometria por conveniência sem avaliar necessidade, base e fornecedor.

Revisar a [Lei 15.211/2025 — ECA Digital](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm), suas normas aplicáveis e as [orientações de aferição de idade da ANPD](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-orientacoes-preliminares-e-cronograma-para-afericao-de-idade-no-ambiente-digital). A revisão deve considerar o serviço de aulas e vídeo, o melhor interesse, a supervisão parental, o canal de relato, a resposta a contatos prejudiciais e a exposição de menores. Documentar avaliação de impacto/riscos, critérios de verificação de professores e protocolo de intervenção.

MINIMUM_AGE deve refletir a faixa aprovada. A data declarada e o vínculo aguardam verificação. A retirada da autorização bloqueia reservas e sala do dependente; a equipe precisa resolver aulas/reembolsos existentes.

## Atendimento a titulares

O painel exporta dados próprios ou do dependente autorizado e gera protocolos de acesso, correção, exclusão, oposição e retirada de autorização. A fila administrativa permite registrar a resolução e executar a exclusão operacional. Para contas suspensas/encerradas, o canal externo de privacidade permanece necessário.

Verificar identidade sem coleta excessiva. Registrar recebimento, decisão, prazo aplicável e comunicação da resposta. Não registrar “resolvido” antes de corrigir os dados ou fornecer a resposta: a ação administrativa registra o atendimento, não envia e-mail automaticamente. Usar o canal aprovado para informar o titular.

Na exclusão, resolver aulas, vínculos e pagamentos em aberto. Remover o cadastro, credenciais de vendedor, registros pedagógicos e conteúdo dispensável; manter apenas registros estritamente necessários, com decisão de retenção documentada. Ordens financeiras e registros de auditoria ficam segregados, inacessíveis pelo SDK do navegador. O operador precisa concluir retenção, expurgo de backups e bloqueio de restauração de dados excluídos.

Para professores com vendas pagas/contestações, a credencial criptografada é segregada em retained_seller_credentials exclusivamente para cumprir reembolsos e obrigações financeiras existentes. O perfil é removido e novas vendas ficam bloqueadas. A decisão de retenção deve justificar esse uso e definir quando eliminar a credencial e o vínculo do provedor; a expiração/revogação exige atendimento financeiro.

Não foi implementado um prazo único de expurgo: o controlador deve aprovar prazos por finalidade e regras legais aplicáveis, incluindo solicitações, incidentes, logs, evidências e documentos financeiros. Sem essa matriz, a documentação jurídica permanece pendente.

## Operadores, transferências e incidentes

Contratar e revisar Firebase/Google, Asaas (assinaturas, subcontas e repasses), Mercado Pago quando avulsas habilitadas, Daily e AWS, com papéis, regiões, suboperadores, mecanismos de transferência e condições de exclusão. O e-mail do pagador verificado vincula o checkout à conta; CPF/cartão coletados na página hospedada não são copiados para a Talkê. Confirmar os papéis próprios do provedor financeiro e a informação a titulares/recebedores. Avaliar [Resolução ANPD 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024) quando houver transferência internacional.

Definir responsáveis, canal de emergência, preservação de evidências, contenção, revogação de credenciais, avaliação de impacto e comunicação. A [Resolução ANPD 15/2024](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-aprova-o-regulamento-de-comunicacao-de-incidente-de-seguranca) regula incidentes relevantes; o prazo geral indicado no regulamento é de três dias úteis, sujeito à análise das condições aplicáveis. Registrar incidentes e decisões mesmo quando não houver comunicação externa.

Não usar dados reais de alunos nos testes. Os emuladores usam projeto demo-talke; o gateway de teste é separado do executável de produção.
