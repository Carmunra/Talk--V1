# Validação do e-mail talke.club — 11/10/2026

Solicitação do operador: corrigir os avisos de SPF e DKIM apresentados no painel Hostinger.

## Resultado

Após a atualização de status e nova consulta do painel, Hostinger apresenta **MX, SPF, DKIM e DMARC validados**, com os quatro indicadores verdes e sem o alerta de registros faltantes.

A zona DNS já continha os valores esperados. Não foi necessário alterar registros. O SPF, o DMARC e os três CNAMEs DKIM também foram confirmados diretamente nos dois servidores autoritativos, byte.dns-parking.com e pixel.dns-parking.com. Foi guardada uma cópia local da zona consultada e uma imagem do painel final.

| Tipo  | Nome                       | Valor                                       | TTL na zona |
| ----- | -------------------------- | ------------------------------------------- | ----------- |
| MX    | @                          | mx1.hostinger.com, prioridade 5             | 14400       |
| MX    | @                          | mx2.hostinger.com, prioridade 10            | 14400       |
| TXT   | @                          | v=spf1 include:_spf.mail.hostinger.com ~all | 3600        |
| CNAME | hostingermail-a._domainkey | hostingermail-a.dkim.mail.hostinger.com     | 300         |
| CNAME | hostingermail-b._domainkey | hostingermail-b.dkim.mail.hostinger.com     | 300         |
| CNAME | hostingermail-c._domainkey | hostingermail-c.dkim.mail.hostinger.com     | 300         |
| TXT   | _dmarc                     | v=DMARC1; p=none                            | 3600        |

A conta contato@talke.club aparece ativa no painel. A política DMARC está em monitoramento (p=none). Não foi enviada mensagem de teste; a validação dos registros não comprova a entrega de uma mensagem específica nem garante ausência de spam.

Os registros de e-mail devem ser preservados ao conectar o site à hospedagem escolhida. O apontamento web continua em preparação.

Referências do provedor: [SPF Hostinger](https://www.hostinger.com/support/1583673-what-is-the-spf-record-for-hostinger-email/), [DKIM Hostinger](https://www.hostinger.com/support/4456413-what-are-the-dkim-records-for-hostinger-email/).
