# Cancelamento e remarcação das aulas — 11/11/2026

Decisão expressa do operador: o aluno adulto/pagador ou responsável pode cancelar uma aula do plano com pelo menos **24 horas antes do início**, sem perder o crédito. O limite exato de 24 horas está incluído; o servidor verifica seu próprio horário e o início da aula em Brasília. A hora informada pelo navegador não autoriza a operação.

## Fluxo do aluno ou responsável

Em Minhas aulas, abrir Cancelar ou remarcar esta aula, conferir o prazo e confirmar o cancelamento. Uma transação devolve um crédito ao lote que financiou a reserva, preserva sua validade vigente, cancela a aula e libera os horários do aluno/professor. Solicitações simultâneas ou repetidas não duplicam o crédito ou alteram a primeira decisão. Créditos vencidos, estornados ou com inconsistência financeira exigem suporte e não são recuperados automaticamente.

Para remarcar, usar Agendar outro horário e fazer nova reserva no catálogo. O novo horário depende da disponibilidade, vínculo com o responsável, professor aprovado e validade do crédito. A aplicação não garante nem ocupa o novo horário antes de cancelar a reserva anterior. Essa condição aparece antes da confirmação. A regra vale também se a contratação inicial da aula ocorrer com menos de 24 horas: nesse caso, o cancelamento exige suporte e não há devolução automática.

O processo não cancela renovação, emite reembolso ou altera a regra separada de 60 dias após cancelar renovação. O crédito volta com a validade vigente do lote, inclusive o prazo fixo já registrado após cancelar renovação; não recebe mais 60 dias por cancelar uma aula. Um estorno/chargeback posterior continua revogando créditos, inclusive os devolvidos por cancelamento.

## Pedidos tardios, faltas e suporte

O operador confirmou análise individual pelo suporte para cancelamentos com menos de 24 horas e faltas. O usuário deve usar Relatar problema ou o canal de atendimento. A fila administrativa recebe o protocolo. Não há multa de 35%/50%, devolução automática de crédito ou repasse automático por falta. Não registrar uma aula como realizada apenas para gerar repasse. O professor conclui e o aluno adulto/pagador ou responsável confirma a realização, preservando a regra de R$ 40 por aula confirmada.

Cancelamentos solicitados pelo professor, contestações e exceções exigem atendimento; não foram convertidos em uma regra automática nova. Registrar avaliação, justificativa e comunicação ao titular. Marcar um protocolo como resolvido no painel apenas registra o atendimento: isso não devolve crédito, reembolsa mensalidade, envia e-mail ou movimenta dinheiro. Qualquer ajuste financeiro/crédito fora do fluxo automático exige procedimento autorizado e auditável, sem editar um saldo para aparentar reembolso concluído.

## Vídeo e segurança

Somente o pagador autenticado e ainda vinculado ao aluno executa o cancelamento automático. Perfis de outras contas, professor e cabeçalhos administrativos forjados não o autorizam. A transação remove o endereço Meet armazenado e enfileira o encerramento Daily quando aplicável; cancelar bloqueia novas entradas na Talkê. O professor/suporte precisa encerrar uma chamada Meet externa ou tratar um link já copiado, conforme [operação do Meet](VIDEO_GOOGLE_MEET.md).

## Aprovação para produção

Os textos comerciais, de contratação, reserva e termos informam a regra. A aprovação dessa decisão de negócio não aprova documentos jurídicos ou operação de menores. Manter as aprovações de lançamento desabilitadas e registrar a versão final dos termos após revisão antes de vender.

O operador ainda não confirmou com o Asaas o recebimento das mensalidades pela plataforma seguido de repasses posteriores por aula. Consulte [perguntas para confirmação comercial](ASAAS_HOMOLOGACAO.md). O fluxo de cancelamento de aula retorna crédito interno e não chama uma API de transferência/reembolso; testes locais não habilitam cobrança live.

Os testes cobrem o limite exato, horário enviado pelo cliente ignorado, titularidade/vínculo, repetição/concorrência, liberação de horários, validade, estorno posterior, nova reserva e ausência de repasse. A transação concorrente também é verificada no Firestore emulado e os fluxos do aluno são exercitados no Cypress. Conferir o resultado do commit no CI antes de incorporar/publicar.

Validação local deste complemento: **174 testes unitários/integrados**, **8 testes Firestore** e **17 cenários Cypress** aprovados; cobertura do servidor de **94,72% de linhas, 91,28% de ramos e 95,86% de funções**, além da tipagem aprovada. Dados e cobranças são fictícios. O CI também verifica auditoria de dependências, Terraform e container/proxy; não substitui a aprovação comercial do Asaas ou homologação no domínio real.
