# AI Handoff

Este arquivo e o ponto central de coordenacao entre Codex, Claude e qualquer outra IA usada neste repositorio.

## Objetivo

- evitar que duas IAs mexam nos mesmos arquivos sem saber
- deixar claro o que esta em andamento
- registrar o que foi mudado, validado e o que ainda falta
- facilitar a retomada de contexto na proxima sessao

## Regras rapidas

1. Leia este arquivo antes de editar qualquer codigo.
2. Olhe primeiro a secao `Em andamento`.
3. Se for tocar em arquivos ainda nao reservados, crie uma entrada nova em `Em andamento`.
4. Se os arquivos que voce quer editar ja estiverem em outra entrada ativa, nao sobrescreva. Registre o conflito em `Bloqueios` ou escolha outro escopo.
5. Ao terminar, mova a entrada para `Concluido recentemente`.
6. Nao apague historico antigo. Apenas reorganize entre secoes.

## Fluxo recomendado

### Antes de comecar

- leia `Em andamento`
- confira `Workspace notes`
- escolha um escopo pequeno
- registre arquivos e objetivo

### Durante a tarefa

- atualize a entrada se o escopo mudar
- registre bloqueios assim que aparecerem
- se encontrar mudancas inesperadas, anote antes de continuar

### Ao finalizar

- mova a entrada para `Concluido recentemente`
- informe arquivos alterados
- informe validacao executada
- informe proximos passos ou riscos

## Template rapido

Use este modelo em `Em andamento`:

```md
## [AI] YYYY-MM-DD HH:MM - titulo curto
- Status: em andamento
- Objetivo: o que esta sendo feito
- Arquivos: `caminho/arquivo1`, `caminho/arquivo2`
- Validacao planejada: build, lint, teste manual ou "nao se aplica"
- Riscos: conflitos, duvidas, dependencias ou "nenhum por enquanto"
```

Ao concluir, mova para `Concluido recentemente` e complete:

```md
## [AI] YYYY-MM-DD HH:MM - titulo curto
- Status: concluido
- Objetivo: o que foi feito
- Arquivos: `caminho/arquivo1`, `caminho/arquivo2`
- Validacao: comandos executados e resultado
- Proximos passos: o que a proxima IA ou humano deve verificar
- Observacoes: decisoes, riscos residuais ou contexto util
```

## Regra de conflito

- Se outra entrada ativa ja listar o mesmo arquivo, considere o arquivo reservado.
- Se precisar mesmo tocar nele, atualize sua entrada dizendo que ha sobreposicao e explique o motivo.
- Em caso de duvida, prefira nao editar ate revisar o diff atual.

## Workspace notes

Data de referencia: 2026-03-17

- O workspace ja estava com varias alteracoes locais em paginas do painel, formularios, services, tipos, schema do banco e APIs.
- Tambem havia arquivos novos em areas como `src/app/api`, `src/lib`, `src/services`, `src/app/(painel)/usuarios` e `.claude/`.
- Antes de editar qualquer uma dessas areas, confira o estado atual para nao sobrescrever trabalho em andamento.

## Em andamento

- Nenhuma atividade ativa no momento.

## Bloqueios

- Nenhum bloqueio registrado no momento.

## Concluido recentemente

## [Codex] 2026-05-23 12:16 - adicionar salvamento de midias em manutencao
- Status: concluido
- Objetivo: incluir no cadastro de manutencao a opcao de selecionar pasta, anexar arquivos e salvar midias locais com a estrutura organizada usada anteriormente
- Arquivos: `docs/ai_handoff.md`, `src/components/forms/ManutencaoForm.tsx`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: validar em `/manutencoes/nova` o fluxo com anexos de imagem/video/documento e confirmar criacao das pastas `Manutencao-data-tipo`, `img`, `video` e `doc-notas-fiscais`
- Observacoes: quando houver arquivos anexados, a pasta de destino passa a ser obrigatoria antes de salvar a solicitacao

## [Codex] 2026-05-23 12:05 - restaurar ambiente dev que nao inicia
- Status: concluido
- Objetivo: corrigir instabilidade do servidor local com erro `__webpack_modules__[moduleId] is not a function` e `Cannot find module './161.js'`
- Arquivos: `docs/ai_handoff.md`, `.next/`
- Validacao: encerrados processos `node`; executado `npm run clean`; servidor dev reiniciado em `http://127.0.0.1:3000`; `HEAD /login` e `HEAD /orcamentos` retornaram `200`
- Proximos passos: se voltar a falhar, rodar `npm run dev:reset` e fazer hard refresh no navegador (`Ctrl+F5`)
- Observacoes: o problema voltou a ser corrupcao de cache/HMR do Next em desenvolvimento, nao erro funcional das telas

## [Codex] 2026-05-23 11:56 - adicionar seletor de ID de manutencao em orcamentos
- Status: concluido
- Objetivo: incluir opcao explicita para selecionar ID da manutencao no formulario de orcamento
- Arquivos: `docs/ai_handoff.md`, `src/components/forms/OrcamentoForm.tsx`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: validar no navegador o fluxo em `/orcamentos/novo` usando o novo seletor de ID e tambem a busca livre
- Observacoes: seletor de ID e campo de busca permanecem sincronizados para evitar perda de contexto da solicitacao escolhida

## [Codex] 2026-05-23 11:42 - reforcar selecao/cadastro de imovel em manutencao
- Status: concluido
- Objetivo: mover definitivamente a selecao e cadastro rapido de imovel para o formulario de manutencao, deixando orcamento apenas vinculado a solicitacao existente
- Arquivos: `docs/ai_handoff.md`, `src/components/forms/ManutencaoForm.tsx`, `src/app/(painel)/manutencoes/nova/page.tsx`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: validar no navegador o fluxo em `/manutencoes/nova` para imovel existente (busca por ID/codigo/endereco) e para novo imovel no mesmo formulario
- Observacoes: manutencao agora usa `imobiliaria_id` do usuario logado para carregar/criar imoveis; orcamento permanece dependente de solicitacao existente

## [Codex] 2026-05-23 11:30 - vincular orcamento a solicitacao de manutencao
- Status: concluido
- Objetivo: obrigar criacao de orcamento somente a partir de solicitacao de manutencao ja cadastrada e facilitar acesso direto pelo modulo de manutencoes
- Arquivos: `docs/ai_handoff.md`, `src/components/forms/OrcamentoForm.tsx`, `src/app/(painel)/orcamentos/novo/page.tsx`, `src/app/(painel)/manutencoes/page.tsx`, `src/app/(painel)/manutencoes/[id]/page.tsx`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: validar no navegador o fluxo `Manutencoes -> Criar orcamento` e confirmar se o usuario evita abrir orcamento sem solicitacao
- Observacoes: o formulario de orcamento nao cria mais solicitacao; agora exige solicitacao existente e permite pre-selecao via query `solicitacaoId`

## [Codex] 2026-05-23 11:22 - diagnosticar erro server em /orcamentos/novo
- Status: concluido
- Objetivo: reproduzir e corrigir o erro `__webpack_modules__[moduleId] is not a function` na rota de novo orcamento
- Arquivos: `docs/ai_handoff.md`, `.next/`
- Validacao: `npm run clean`; reinicio do `next dev` em `http://127.0.0.1:3000`; `curl -I` retornou `200` para `/orcamentos` e `/orcamentos/novo`; `npm run build` concluido com sucesso
- Proximos passos: se o erro reaparecer no navegador, executar `npm run dev:reset` e fazer hard refresh (`Ctrl+F5`) na aba com erro
- Observacoes: causa observada novamente foi inconsistencia de cache/HMR do Next em dev, sem indicio de falha de compilacao do codigo da tela

## [Codex] 2026-05-23 10:57 - reformular fluxo de orcamentos
- Status: concluido
- Objetivo: automatizar o ID da solicitacao no cadastro de orcamento, permitir selecao/digitacao de prestador e imovel, incluir cadastro rapido de novo imovel, ampliar descricao e organizar upload de midias em pastas locais
- Arquivos: `docs/ai_handoff.md`, `src/components/forms/OrcamentoForm.tsx`, `src/app/(painel)/orcamentos/novo/page.tsx`, `src/app/(painel)/orcamentos/page.tsx`, `src/services/orcamentosService.ts`
- Validacao: `npm run build` concluido com sucesso (type-check e geracao de rotas sem erro)
- Proximos passos: validar fluxo manual no navegador em `/orcamentos/novo` (criar com imovel existente, criar com novo imovel e salvar midia com pasta selecionada)
- Observacoes: o salvamento de midias em pasta local depende de navegador com suporte a `showDirectoryPicker` (ex.: Chromium); quando nao houver suporte, o formulario salva o orcamento normalmente sem gravacao local de arquivos

## [Codex] 2026-05-23 10:39 - corrigir erro server em /prestadores
- Status: concluido
- Objetivo: reproduzir e corrigir o erro `__webpack_modules__[moduleId] is not a function` reportado na rota `/prestadores`
- Arquivos: `docs/ai_handoff.md`
- Validacao: logs do Next apontaram cache corrompido em `.next/server/vendor-chunks/*`; processo `next dev` reiniciado apos `npm run clean`; `curl -I` confirmou `200` para `/prestadores` e `/prestadores/novo`
- Proximos passos: se o erro reaparecer, executar `npm run dev:reset` e recarregar com hard refresh no navegador
- Observacoes: causa foi cache/HMR do Next no ambiente local, sem indicio de falha de regra de negocio da tela

## [Codex] 2026-05-23 10:34 - garantir cadastro de prestador mesmo com schema antigo
- Status: concluido
- Objetivo: fazer o cadastro de prestadores funcionar mesmo sem as colunas novas aplicadas no banco remoto
- Arquivos: `docs/ai_handoff.md`, `src/services/prestadoresService.ts`, `src/app/(painel)/prestadores/novo/page.tsx`
- Validacao: `npm run build` concluido; teste real de insert confirmou fallback compativel com schema antigo (`COMPAT_INSERT_OK`) e limpeza do registro de teste
- Proximos passos: aplicar as migracoes `database/migrations/2026-05-23_add_pagamento_prestadores.sql` e `database/migrations/2026-05-23_add_dados_recebimento_prestadores.sql` quando houver acesso SQL administrativo
- Observacoes: quando a API retornar `PGRST204` por coluna ausente, o service salva em modo compativel e preserva os dados de pagamento em marcador estruturado dentro de `especialidade`

## [Codex] 2026-05-23 10:27 - diagnosticar erro ao salvar prestador
- Status: concluido
- Objetivo: identificar a causa real do erro no cadastro de prestador apos adicao dos novos campos de pagamento
- Arquivos: `docs/ai_handoff.md`
- Validacao: reproducao de insert com Service Role retornou `PGRST204` com mensagem `Could not find the 'dados_recebimento' column of 'prestadores' in the schema cache`
- Proximos passos: aplicar as migracoes `database/migrations/2026-05-23_add_pagamento_prestadores.sql` e `database/migrations/2026-05-23_add_dados_recebimento_prestadores.sql` na base atual
- Observacoes: erro nao e da tela; e incompatibilidade entre codigo local e schema remoto ainda sem a coluna nova

## [Codex] 2026-05-23 10:23 - diagnosticar pagina que nao abre
- Status: concluido
- Objetivo: reproduzir erro de abertura reportado apos ajustes no cadastro de prestadores
- Arquivos: `docs/ai_handoff.md`
- Validacao: servidor de desenvolvimento estava parado; `next dev` reiniciado em `http://127.0.0.1:3000`; checagem HTTP retornou `200` para `/login`, `/prestadores` e `/prestadores/novo`
- Proximos passos: acessar o sistema por `http://127.0.0.1:3000` e manter uma instancia `next dev` ativa
- Observacoes: nao foi identificado erro de codigo na pagina durante o teste de rota

## [Codex] 2026-05-23 10:21 - adicionar dados de recebimento no prestador
- Status: concluido
- Objetivo: incluir campo digitavel para dados de recebimento vinculado ao metodo de pagamento do prestador
- Arquivos: `docs/ai_handoff.md`, `src/app/(painel)/prestadores/novo/page.tsx`, `src/app/(painel)/prestadores/page.tsx`, `src/types/database.types.ts`, `database/schema.sql`, `database/migrations/2026-05-23_add_dados_recebimento_prestadores.sql`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: aplicar a migracao `database/migrations/2026-05-23_add_dados_recebimento_prestadores.sql` na base existente para gravar o novo campo
- Observacoes: ao selecionar metodo de recebimento, o formulario agora exige preenchimento de dados de pagamento com orientacao especifica por metodo

## [Codex] 2026-05-23 10:17 - ampliar cadastro de prestadores
- Status: concluido
- Objetivo: incluir no cadastro de prestadores os campos de faturamento, metodo de recebimento e dia da semana para recebimento
- Arquivos: `docs/ai_handoff.md`, `src/app/(painel)/prestadores/novo/page.tsx`, `src/app/(painel)/prestadores/page.tsx`, `src/types/database.types.ts`, `database/schema.sql`, `database/migrations/2026-05-23_add_pagamento_prestadores.sql`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: aplicar a migracao `database/migrations/2026-05-23_add_pagamento_prestadores.sql` na base existente antes de cadastrar novos prestadores em producao
- Observacoes: cadastro agora exige selecao de faturamento, metodo de recebimento e dia de recebimento; listagem de prestadores tambem exibe esses campos

## [Codex] 2026-05-23 10:08 - diagnosticar dashboard que nao abre
- Status: concluido
- Objetivo: reproduzir erro de abertura reportado pelo usuario e corrigir a causa
- Arquivos: `docs/ai_handoff.md`
- Validacao: detectado conflito de porta (`EADDRINUSE`) com multiplas instancias `next dev` (3000, 3001 e 3020); processos antigos encerrados; servidor reiniciado em `http://127.0.0.1:3000`; checagem com `curl -I` retornou `200` para `/login` e `/dashboard`
- Proximos passos: acessar o app por `http://127.0.0.1:3000` e manter apenas uma instancia `next dev` ativa
- Observacoes: o problema era de ambiente local (processos presos), nao de codigo da pagina do dashboard

## [Codex] 2026-05-23 10:00 - remover cards de valores no dashboard
- Status: concluido
- Objetivo: retirar da pagina do dashboard os indicadores financeiros (valores, custos e taxas)
- Arquivos: `docs/ai_handoff.md`, `src/app/(painel)/dashboard/page.tsx`
- Validacao: `npm run clean` e `npm run build` concluidos com sucesso
- Proximos passos: validar visualmente o dashboard no navegador para confirmar o layout com 3 cards
- Observacoes: removida tambem a consulta da tabela `financeiro` no carregamento do dashboard

## [Codex] 2026-05-23 09:55 - resetar senha de acesso
- Status: concluido
- Objetivo: redefinir credencial de acesso no Supabase para recuperar login do usuario
- Arquivos: `docs/ai_handoff.md`
- Validacao: consulta na tabela `usuarios` encontrou 1 conta ativa (`leotaq@gmail.com`); senha redefinida via Supabase Admin; login validado com `signInWithPassword` usando a nova senha
- Proximos passos: realizar login pelo app com `leotaq@gmail.com` ou `leoadm` e alterar para uma senha forte apos o acesso
- Observacoes: senha solicitada aplicada como `ariele22`

## [Codex] 2026-05-23 09:41 - identificar Supabase em uso
- Status: concluido
- Objetivo: confirmar qual projeto Supabase esta configurado no ambiente local atual
- Arquivos: `docs/ai_handoff.md`
- Validacao: leitura de `.env.local`, `.env.example` e busca por variaveis `NEXT_PUBLIC_SUPABASE_URL` no repositorio
- Proximos passos: manter chaves do `.env.local` fora de compartilhamento publico e rotacionar se necessario
- Observacoes: projeto ativo identificado pela URL `https://outujbsyzdeqbwvlutzh.supabase.co` (ref `outujbsyzdeqbwvlutzh`)

## [Codex] 2026-05-23 09:37 - validar estado atual do projeto
- Status: concluido
- Objetivo: executar validacoes automatizadas para verificar como o projeto esta no estado atual
- Arquivos: `docs/ai_handoff.md`
- Validacao: `npm run test` falhou porque nao existe script `test`; `npm run lint` abriu prompt interativo de configuracao do ESLint; `npm run build` concluiu com sucesso em ambiente com `.env.local`
- Proximos passos: criar script de testes automatizados e configurar ESLint para o comando `npm run lint` rodar sem interacao
- Observacoes: o build atual do Next.js 14.2.15 compila, faz type-check e gera as rotas sem erro

## [Codex] 2026-03-17 21:40 - corrigir build do Vercel sem env do Supabase admin
- Status: concluido
- Objetivo: evitar falha prematura no build causada pela inicializacao do Supabase Admin e mapear as variaveis obrigatorias para deploy no Vercel
- Arquivos: `docs/ai_handoff.md`, `.env.example`, `src/lib/supabaseAdmin.ts`, `src/app/api/usuarios/route.ts`, `src/app/api/usuarios/reset-senha/route.ts`
- Validacao: `npm run build` concluido com sucesso com `.env.local`; build sem `.env.local` reproduziu falta de `NEXT_PUBLIC_SUPABASE_URL` nas paginas e confirmou dependencia das envs do Supabase no Vercel
- Proximos passos: cadastrar no Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`, depois redeployar
- Observacoes: as rotas de API com admin nao quebram mais so por serem importadas no build; o erro seguinte vem da ausencia das envs publicas usadas nas paginas e services

## [Codex] 2026-03-17 21:20 - publicar estado atual no git
- Status: concluido
- Objetivo: revisar o estado atual do repositorio, validar a compilacao e publicar as alteracoes no GitHub
- Arquivos: `.gitignore`, `docs/ai_handoff.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `database/schema.sql`, `database/migrations/2026-03-17_add_complemento_imoveis.sql`, `src/app/(painel)`, `src/app/api`, `src/components`, `src/lib`, `src/services`, `src/types`
- Validacao: `npm run build` concluido com sucesso; `git status` revisado antes do commit
- Proximos passos: seguir com a etapa de marketing e notificacao das vistorias recebidas
- Observacoes: `/.claude/settings.local.json` ficou fora do versionamento por ser configuracao local da maquina

## [Codex] 2026-03-17 00:00 - estruturar criacao de vistorias
- Status: concluido
- Objetivo: tornar a criacao de vistoria utilizavel com `people` vazio e aproveitar melhor os dados de property
- Arquivos: `src/app/(painel)/vistorias/nova/page.tsx`, `src/services/peopleService.ts`, `src/app/(painel)/vistorias/page.tsx`, `docs/ai_handoff.md`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: implementar a etapa operacional da vistoria, com pagina de detalhe, agendamento, transicao de status e historico
- Observacoes: a tela agora garante a pessoa operacional do usuario logado, permite cadastrar vistoriador rapido e reaproveita o endereco do imovel pelo codigo quando ele ja existir

## [Codex] 2026-03-17 00:00 - aplicar complemento no banco remoto
- Status: concluido
- Objetivo: executar a alteracao do campo `complemento` diretamente na base remota do projeto `imobgestor`
- Arquivos: `docs/ai_handoff.md`
- Validacao: alteracao aplicada via Management API; consulta em `rest/v1/imoveis?select=complemento&limit=1` retornou `200` sem erro de coluna
- Proximos passos: o cadastro de imovel ja pode salvar `complemento` na base atual
- Observacoes: foi necessario usar um `SUPABASE_ACCESS_TOKEN`; tokens sensiveis nao foram registrados no repositorio

## [Codex] 2026-03-17 00:00 - organizar alteracao SQL de complemento
- Status: concluido
- Objetivo: deixar a alteracao do campo `complemento` registrada no SQL do projeto de forma facil de aplicar em bases existentes
- Arquivos: `database/schema.sql`, `database/migrations/2026-03-17_add_complemento_imoveis.sql`, `docs/ai_handoff.md`
- Validacao: revisao manual dos arquivos SQL concluida
- Proximos passos: executar a migracao no SQL Editor do Supabase se a base atual ja estiver criada
- Observacoes: a alteracao ficou tanto no schema principal quanto em uma migracao separada para facilitar aplicacao pontual

## [Codex] 2026-03-17 00:00 - melhorar cadastro de imovel
- Status: concluido
- Objetivo: incluir campo de complemento e melhorar a interface do formulario de cadastro de imovel
- Arquivos: `src/components/forms/ImovelForm.tsx`, `src/types/database.types.ts`, `database/schema.sql`, `src/app/(painel)/imoveis/novo/page.tsx`, `src/app/(painel)/imoveis/[id]/page.tsx`, `docs/ai_handoff.md`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: aplicar no Supabase o `alter table imoveis add column if not exists complemento text null;` caso a base atual ja exista
- Observacoes: o formulario foi reorganizado em blocos visuais e agora mostra uma previa do endereco durante o preenchimento

## [Codex] 2026-03-17 00:00 - corrigir erro de server cache do Next
- Status: concluido
- Objetivo: corrigir erro `__webpack_modules__[moduleId] is not a function` no ambiente de desenvolvimento
- Arquivos: `package.json`, `docs/ai_handoff.md`
- Validacao: `npm run clean` executado com sucesso; `npm run build` executado com sucesso em compilacao limpa
- Proximos passos: reiniciar o servidor de desenvolvimento usando `npm run dev:reset` ou parar o `next dev` atual e iniciar novamente
- Observacoes: o erro se comporta como inconsistencia de cache/HMR do Next; foi adicionado um script para limpar `.next` com facilidade

## [Codex] 2026-03-17 00:00 - corrigir carregamento travado apos login
- Status: concluido
- Objetivo: corrigir o estado de carregamento preso no painel apos autenticacao
- Arquivos: `src/lib/useUsuario.ts`, `docs/ai_handoff.md`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: testar novamente o login; se ainda ficar preso em `Carregando...`, verificar no console do navegador se ha erro de rede ou de permissao na consulta da tabela `usuarios`
- Observacoes: a chamada de carregamento do perfil foi adiada para fora do callback sincrono de `onAuthStateChange`, evitando travamento do cliente Supabase

## [Codex] 2026-03-17 00:00 - corrigir login Supabase
- Status: concluido
- Objetivo: corrigir o fluxo de login para evitar retorno indevido para `/login` e validar a existencia do usuario na tabela `usuarios`
- Arquivos: `src/app/login/page.tsx`, `src/lib/useUsuario.ts`
- Validacao: `npm run build` concluido com sucesso
- Proximos passos: testar login real com um usuario ativo; se ainda falhar, conferir se o email existe na tabela `usuarios` e se `ativo = true`
- Observacoes: o repositorio ja estava com muitas alteracoes locais fora do fluxo de login, e elas nao foram revertidas

## [Codex] 2026-03-17 00:00 - estruturar handoff entre IAs
- Status: concluido
- Objetivo: melhorar o fluxo de coordenacao entre IAs com secoes claras, regra de conflito e template de uso rapido
- Arquivos: `docs/ai_handoff.md`, `AGENTS.md`, `CLAUDE.md`
- Validacao: revisao manual do conteudo e verificacao dos arquivos criados/atualizados
- Proximos passos: usar este arquivo como rotina obrigatoria antes e depois de cada tarefa
- Observacoes: este arquivo foi reestruturado para ficar mais facil de escanear no inicio de cada sessao
