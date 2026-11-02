> Registro histórico anterior à aplicação. Estado atual: base privada criada após recuperação verificada das oito tabelas; consulte EXECUCAO-MANUTENCAO.md e execucao-verificada.json.

# Conferência administrativa — Supabase / Gestor Imob

19/10/2026, America/Sao_Paulo. **Somente leitura no projeto real. Nenhuma migração, dado ou permissão remota foi alterado.**

## Projeto e pré-requisitos

O plugin instalado permitiu identificar `novabase`, referência `pfakuvnuyixebvtmwmgu`, correspondente ao endereço fornecido pelo usuário. Estado retornado: `ACTIVE_HEALTHY`; PostgreSQL 17.6; região `sa-east-1`. Consultas de catálogo foram executadas explicitamente em transações de leitura. Não foram selecionados registros de imóveis/pessoas, segredos, usuários de Auth ou conteúdo de arquivos.

O schema proposto `gestor_manutencao` ainda não existe. Os papéis `anon`, `authenticated` e `service_role` existem; a função `gen_random_uuid()` está disponível. `properties.id` é UUID e chave primária. Foi confirmada uma restrição `UNIQUE (code_normalized)`, distinta de uma garantia sobre o valor literal de `code`; valores nulos e o algoritmo de normalização precisam ser considerados. Também existe uma restrição de cidades no cadastro atual; não a modificar para ampliar cidades do módulo novo.

Não foram retornados branches de desenvolvimento existentes. Isso não informa o plano contratado, custos ou disponibilidade de backups.

## Permissões existentes — constatações, sem correção aplicada

| Objeto | Evidência administrativa |
|---|---|
| `people`, `properties`, `inspections`, `inspection_checklist_items`, `inspection_status_events`, `default_checklist_items`, `__codex_probe` | RLS desativado; privilégios de SELECT, INSERT, UPDATE, DELETE e outros concedidos a `anon`, `authenticated` e `service_role`. |
| `work_schedules` | RLS ativo, mas policy `service role full access` usa `TO public`, `USING (true)` e `WITH CHECK (true)`. O nome da policy não restringe o papel; com os grants existentes, ela é ampla. |
| `public` | `anon` possui USAGE; privilégios padrão atualmente amplos para objetos futuros nesse schema. |

O Security Advisor confirmou sete ocorrências de RLS desativado, além de avisos sobre `public.set_updated_at` sem `search_path` fixo e extensão `btree_gist` em `public`. Referências oficiais de diagnóstico: [RLS desativado](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public), [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [extensão em public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).

Isso demonstra a configuração permissiva atual, sem provar incidente, identidade de quem acessou ou executar escrita pela API. Não corrigir automaticamente: o sistema de vistorias pode depender desse acesso. A correção precisa de tarefa própria com análise do aplicativo, teste e transição de identidade/autorização. A nova manutenção não deverá herdar esses grants.

Seis event triggers habilitados foram encontrados e suas definições administrativas revisadas: dois notificam o PostgREST para recarregar schema; os demais tratam extensões GraphQL, Cron e Net e são condicionados a eventos dessas extensões. O rascunho não cria extensões. A leitura dessas definições não substitui testar o comportamento efetivo do serviço gerenciado. Não desativar ou alterar esses gatilhos.

Foram preservados metadados de 23 constraints, dois gatilhos de tabela e 20 índices de `public` para comparação posterior. **Esses metadados não são um backup**, não incluem linhas ou todos os objetos/configurações do projeto.

## Validação executada fora da produção

O mesmo arquivo `001_manutencao_base.sql`, SHA256 `FE439C352C2F68CE595CBB0B9EDB88A5E3D2187FF1070B34B31FD160256470FE`, foi executado em [PGlite](https://pglite.dev/docs/) 0.5.10, PostgreSQL 18.6 em memória, com papéis simulados e dados exclusivamente fictícios. Foram aprovadas **17 verificações**:

- Execução do DDL, quatro tabelas com RLS e ausência de novos acessos para os três papéis.
- Preservação das definições/permissões de três tabelas antigas fictícias do teste.
- Cadastro declarado, endereço com “s/n”, campos obrigatórios, contato e vínculo pendente.
- Bloqueio de histórico/anexos associados a chamado de outra organização.
- Notas/anexos internos por padrão e limite de tamanho de metadados de arquivo.
- Exclusão de imóvel fictício pelo sistema antigo sem bloqueio, preservando o código/endereço no chamado.
- RLS sem policies bloqueando acesso mesmo com grants temporários no teste.
- Recusa de reaplicação sobre schema já existente e reversão integral ao simular falha antes do commit.

Resultado detalhado em `validacao-postgres-local.json`; teste reproduzível em `validacao-local/`. A dependência é fixada no lockfile de teste, separada das dependências da aplicação.

**Limites:** o motor local é PostgreSQL 18.6, enquanto o projeto usa 17.6. Não foram reproduzidos Auth, Storage, PostgREST, extensões/event triggers gerenciados nem o site de vistorias contra uma cópia real. O teste não comprova restauração de backup, segurança de runtime ou prontidão para produção. A migração permanece sem aplicação remota.

## Backup e condição para avançar

O usuário informou **não ter backup com restauração testada**. Não foi criado ou validado um backup nesta etapa. O painel inicialmente redirecionou para login. Depois de o usuário entrar, foi confirmado o plano Free e a informação de que ele não inclui backups do projeto. Nenhum plano foi alterado. Não foram solicitadas senhas ou novas chaves no chat.

Plano confirmado no [painel de backups do projeto](https://supabase.com/dashboard/project/pfakuvnuyixebvtmwmgu/database/backups/scheduled): **Free, sem backups incluídos**. Foi preparado PostgreSQL 17.11 portátil oficial e um script de exportação local, ainda não executado porque a senha de conexão não está disponível. O usuário foi perguntado se a possui, sem solicitar envio pelo chat. A senha será recebida em entrada protegida no computador. Backups físicos não são um arquivo lógico baixável para `pg_restore`; dependendo da modalidade, será necessário gerar exportação lógica por ferramenta oficial ou usar restauração para novo projeto.

Antes de qualquer restauração, identificar o **destino separado de teste**. Não acionar “Restore” no projeto atual: essa operação afeta sua disponibilidade e seus dados. Uma cópia na nuvem pode ter custo, que deve ser conhecido e autorizado antes da criação.

A recuperação deve incluir estrutura, dados, permissões relevantes e arquivos de Storage, se usados; backup do banco contém metadados de Storage, não os arquivos. Registrar hash/tamanho/data dos artefatos, proteger o acesso e confirmar recuperação das contagens e dos fluxos da vistoria no destino. Depois testar a migração nessa cópia e comparar o catálogo antigo. Referência: [Backups do Supabase](https://supabase.com/docs/guides/platform/backups).

O changelog oficial foi consultado. A mudança de exposição automática de novas tabelas em `public`, prevista para todos os projetos em 30/10/2026, reforça a necessidade de grants explícitos e revisão do escopo. Não foi alterada configuração global por causa dessa notícia; as tabelas existentes conservam seus grants segundo o [changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## Arquivos de evidência

- `auditoria-administrativa.json`: versão, RLS, policies, grants, papéis, schema-alvo, branches e Advisor; somente metadados.
- `ddl-eventos-e-constraints.json`: funções de event triggers e constraints do imóvel; sem dados de negócio ou segredos.
- `baseline-catalogo-public.json`: constraints, índices e gatilhos de tabela; não é dump completo.
- `validacao-postgres-local.json`: 17 verificações locais e limites.

A aplicação Gestor Imob continua com SQLite/dados fictícios. Plugin e login do painel confirmados. A pendência atual é a senha de conexão para gerar o backup local, seguida da restauração em destino separado. Nenhuma migração foi aplicada. Preparação documentada em `BACKUP-LOCAL.md`; contagens adicionais somente de leitura retornaram zero usuários Auth, zero buckets e zero objetos Storage.
