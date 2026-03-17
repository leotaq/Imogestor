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

- Nenhuma entrada ativa no momento.

## Bloqueios

- Nenhum bloqueio registrado no momento.

## Concluido recentemente

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
