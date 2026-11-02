# Arquitetura local e operação

## Executar

Node.js 24. Não é necessário instalar pacotes: `npm.cmd start` na pasta do projeto. A aplicação usa apenas módulos nativos. A porta padrão é 4173; pode ser alterada com a variável `PORT`. O servidor sempre escuta em `127.0.0.1`. `NODE_ENV=production` bloqueia esta versão de demonstração.

## Estrutura

- `server/database.js`: esquema idempotente e carga fictícia apenas em banco vazio; não reseta dados a cada início.
- `server/service.js`: regras, validações, autorização de ações, transações e eventos.
- `server/http.js`: sessão, controle de origem, rotas, arquivos privados e CSV.
- `server/index.js`: inicialização local e controle de uma instância por pasta.
- `server/backup.js`, `scripts/backup.js`: cópia verificada do banco e anexos, com servidor parado.
- `public/`: interface própria sem bibliotecas ou recursos remotos.
- `test/`: cenários automatizados com banco temporário separado da demonstração.

Tabelas: organizations, users, sessions, properties, providers, inspections, inspection_events, inspection_notifications, contracts, contract_events, contract_notifications, tickets, quotes, orders, notes, events, costs e attachments. Relações críticas usam organização na chave estrangeira. Vistorias e contratos apontam para `properties` e guardam snapshot do código/endereço para preservar a referência histórica. Valores monetários são inteiros em centavos.

Rotas principais: `/api/login`, `/api/logout`, `/api/state`, `/api/inspections`, `/api/contracts`, `/api/contracts/:id`, `/api/notifications`, `/api/tickets`, `/api/tickets/:id`, filhos de notas/orçamentos/OS/custos/anexos, `/api/properties`, `/api/providers` e `/api/export`. As rotas privadas exigem sessão; ações sensíveis verificam papel. Não há API pública de inquilino.

## Dados e controles

Banco em `data/gestor.sqlite`, sessões no mesmo banco; arquivos em `uploads/` com identificadores aleatórios. Os caminhos de armazenamento não são retornados ao navegador. Cadastros e notas são escapados na interface. Conteúdo de CSV é protegido contra fórmulas. Formulários mutáveis exigem cabeçalho do cliente e origem local; CSP restringe carregamentos.

Os controles são uma primeira implementação e têm limitações descritas em `ESTADO-IMPLEMENTACAO.md`. Não usar contas de demonstração para dados reais ou publicar esta versão.

## Backup e recuperação

1. Encerre o servidor com Ctrl+C. Confirme que a janela encerrou normalmente; o comando de backup recusa um marcador de servidor ativo.
2. Execute `npm.cmd run backup`. Ele cria uma pasta inédita em `backups/`, com `gestor.sqlite`, `uploads/` e `manifest.json`. O manifesto só é criado após conferência de integridade do banco e hashes dos anexos.
3. Guarde a pasta completa em armazenamento adequado. Banco sem anexos não é backup completo.
4. Para ensaiar restauração, use **uma nova cópia do código em outra pasta**, mantendo o original intacto. Com ambos os servidores parados, coloque o banco restaurado em `data/gestor.sqlite` e os arquivos restaurados em `uploads/` dessa cópia; não copiar `server.lock` antigo.
5. Confira o hash do banco e os arquivos contra o manifesto antes de abrir a aplicação. Inicie a cópia em outra porta e verifique chamados e abertura de fotos/documentos. Se faltarem arquivos ou houver divergência, interrompa a restauração e preserve as fontes para diagnóstico.

Não há comando automático de restauração destrutiva. Os testes exercitam a recuperação de banco e bytes do anexo em pasta temporária. Backups incluem registros e sessões privadas; manter acesso restrito e fora do Git.

## Fontes técnicas

- [SQLite no Node.js](https://nodejs.org/api/sqlite.html); a documentação corrente pode diferir do runtime 24 instalado, cuja API foi verificada localmente.
- [Derivação de senha com scrypt](https://nodejs.org/api/crypto.html#cryptoscryptsyncpassword-salt-keylen-options).
