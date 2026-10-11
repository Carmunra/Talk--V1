# Talkê

Aplicação de aulas de inglês com React/TypeScript, Express, Firebase Admin, Mercado Pago Checkout Pro com split e salas privadas Daily.

Esta versão substitui os fluxos demonstrativos por autenticação no servidor, autorização por titular, reservas atômicas, confirmação de pagamento pelo provedor e atendimento de privacidade. O catálogo, reservas, diagnóstico, materiais, registros pedagógicos e administração usam o novo fluxo. Carteira pré-paga e saques internos não fazem parte deste lançamento.

Antes de publicar, consulte [Publicação](docs/PUBLICACAO.md) e [LGPD e proteção de menores](docs/PRIVACIDADE_OPERACAO.md). Credenciais, habilitação de split, identidade jurídica, homologação externa, matriz de retenção e procedimentos de aferição de idade permanecem requisitos do operador. Os indicadores de aprovação não substituem esses procedimentos.

## Desenvolvimento

Requisitos: Node 22.17+, npm 10 e Java 21 para o emulador Firestore.

Copie .env.example e preencha o projeto Firebase e sua configuração pública web. Use um projeto de desenvolvimento separado, com Application Default Credentials. Instale com npm ci e execute npm run dev. O servidor não cria dados de demonstração, não usa banco em memória e falha quando o banco está indisponível.

## Verificação

- npm run lint inclui aplicação, testes e scripts.
- npm run test:coverage executa unitários/integrados com cobertura mínima de 80% de linhas, 70% de ramos e 75% de funções nos módulos do servidor.
- npm run test:rules valida negação de acesso direto, rollback e concorrência de reservas no Firestore emulado.
- npm run test:e2e usa Auth emulator e Cypress; pagamentos são controlados por um adaptador exclusivo de testes.
- npm run build requer configuração pública VITE_FIREBASE_* e gera dist/client, dist/server e dist/scripts.
- npm run verify:artifacts impede exposição de servidor, mapas de código, segredos e helpers de teste no cliente.
- npm audit identifica alertas conhecidos de dependências. O lockfile é npm; as versões transitivas corrigidas estão registradas em overrides.
- npm run verify:lockfile verifica os binários nativos de Windows/Linux/macOS antes da instalação. Se uma instalação local do npm remover dependências opcionais de outro sistema, regenere o lockfile em uma pasta limpa sem node_modules e revise as alterações antes de enviá-lo.

O fluxo CI não publica nem executa cobranças reais. Os testes de navegador não substituem homologação de Mercado Pago/Daily ou revisão de LGPD/ECA Digital.

## API e identidade

Bearer Firebase ID token é obrigatório nas rotas privadas. Não há autorização por x-user-id, e-mail hardcoded ou seletor de demonstração. Cadastro e termos são ligados ao UID. Com menores habilitados, adultos aguardam aferição de idade e dependentes aguardam validação do vínculo.

As regras Firestore/Storage negam acesso pelo navegador. Firebase Admin depende de IAM e dos controles da API. Regras remotas precisam ser implantadas explicitamente; nenhuma implantação é feita automaticamente ao iniciar a aplicação.

Os detalhes operacionais e critérios de liberação comercial estão em docs/PUBLICACAO.md.

Os resultados executados e seus limites estão em [Validação](docs/VALIDACAO.md).

A infraestrutura preparada e os procedimentos de ativação, restauração e incidentes estão em [Operação](docs/OPERACAO.md). A configuração Terraform é validada com provedor simulado; a ativação requer projeto, imagem, contatos, segredos e aprovações reais.
