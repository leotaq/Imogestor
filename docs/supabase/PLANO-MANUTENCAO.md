# Manutenção no banco compartilhado — proposta inicial

## Estado atual — 19/10/2026, após aplicação

A base privada de manutenção foi criada no projeto `novabase`, migração `20261020022640_gestor_manutencao_base_privada`. Existem quatro tabelas novas em `gestor_manutencao`, vazias, com RLS ativo e sem USAGE/acesso de leitura para anon, authenticated e service_role. Não foram expostos schemas novos na Data API. Não há FK para tabelas antigas.

O usuário autorizou a cópia local e, especificamente, a passagem dos dados das oito tabelas pelo plugin/agente. A gravação foi direta por ferramenta de arquivos, sem transportar registros pelo terminal. A cópia das oito tabelas foi restaurada no PostgreSQL 17.11 local, convertida em arquivo nativo e restaurada novamente. Todos os 4.489 registros coincidiram em três comparações completas, incluindo após testar a manutenção na cópia. O servidor local foi encerrado.

Essa recuperação cobre as oito tabelas do aplicativo e os objetos públicos observados necessários à restauração; não é backup completo dos serviços/configurações do projeto Supabase. A metadata foi coletada separadamente das linhas. O snapshot de linhas é consistente em uma única transação. Arquivos privados em `backups/supabase/20261020T021543Z-aplicativo-19a54295`, fora do Git e com ACL restrita. Nenhuma senha do Supabase foi salva ou redefinida.

Na produção, colunas, defaults, função, gatilhos, RLS, proprietários, grants, constraints, índices e policies das tabelas antigas foram conferidos sem diferenças. A migração só criou objetos novos. A aplicação Gestor Imob continua SQLite/dados fictícios; identidade, autorização e adaptador de runtime ainda precisam ser implementados. Não ligar dados reais às contas fictícias de demonstração. Não houve teste completo da interface de vistorias contra uma cópia, apenas fluxo SQL e verificações de dados/estrutura.

Evidência atual: `EXECUCAO-MANUTENCAO.md`, `execucao-verificada.json` e relatório de restauração. As seções abaixo registram o levantamento/plano anteriores; referências a pendências de login, senha, backup ou aplicação devem ser lidas em sua ordem histórica.


Estado: **base privada aplicada ao Supabase em 19/10/2026**, migração `20261020022640_gestor_manutencao_base_privada`. Observação e decisões em 19/10/2026. O sistema atual de vistorias continua sendo a fonte dos imóveis e da equipe; manutenção ainda roda na demonstração SQLite.

## O que o endereço enviado mostrou

[Alice Imóveis Vistorias](https://visto-new.vercel.app/vistorias) abriu nesta sessão com modo de consulta e botão para selecionar usuário. Foram observados filtros de vistoriador, solicitante e situação, modos Lista/Kanban, código/endereço nos cartões, prazos, agendamento, checklist e mapa. Situações visíveis: Nova, Recebida, Em andamento, Concluída, Sem Contrato, Finalizada e Cancelada.

Não foi selecionada identidade, aberto formulário de alteração, executada edição nem copiado registro individual para este documento. A tela carregou dados reais de consulta; a constatação anterior de que não foram baixadas linhas pessoais refere-se exclusivamente à inspeção de metadados pela Data API. A visualização da página, posteriormente, exibiu dados na interface. Esta observação não prova RLS, ausência de sessão, permissão de escrita nem que o site usa exatamente o projeto Supabase informado. Não foi inspecionado código privado ou tráfego interno para estabelecer essa associação.

**Confirmado pelo usuário:** `properties.code` é o registro do imóvel na imobiliária; `people` contém apenas equipe e vistoriadores. Titular/inquilino não será procurado nesse cadastro. Selecionar uma pessoa na tela não é evidência suficiente de autenticação a reutilizar no novo SaaS.

## Separação proposta

Criar somente o schema `gestor_manutencao`, inicialmente fechado, com quatro tabelas:

| Tabela | Conteúdo |
|---|---|
| `organizations` | Imobiliária responsável pelos chamados; base para isolamento entre futuros clientes do SaaS. |
| `requests` | Protocolo, origem, titular declarado, solicitante, contato, endereço completo, categoria, descrição, prioridade, situação, prazo e vínculo ao imóvel conferido pela equipe. |
| `request_events` | Histórico e notas, com autoria informada pelo servidor e visibilidade interna como padrão. |
| `request_attachments` | Referência ao arquivo privado, tamanho, tipo, hash, autor e visibilidade; não armazena fotos nem cria bucket nesta etapa. |

Nome do titular, nome do solicitante, rua, número (aceitando texto como “s/n”), bairro, cidade, UF, CEP, categoria e descrição são obrigatórios; complemento é opcional; exigir telefone ou e-mail. Fotos são anexos. A exigência de CEP e o limite proposto de 10 MiB por arquivo devem ser confirmados no piloto; tipo de conteúdo e assinatura serão validados no servidor. Abertura pública sem login cria um vínculo **pendente de conferência**, sem comprovar titularidade pelo nome/endereço.

`property_id` guarda o UUID lógico de `public.properties`, acompanhado de cópias de código/endereço. **Não criar FK para as tabelas antigas nesta fase:** uma FK pode impedir a exclusão de imóvel pelo outro aplicativo. O servidor deverá conferir o imóvel na organização adequada, tratar imóvel ausente, códigos repetidos e manter o retrato do chamado mesmo se o cadastro de origem mudar. A equipe será associada somente após validar seus papéis e sua identidade de acesso.

As FKs existentes no rascunho ligam apenas tabelas novas entre si, incluindo a organização para impedir eventos/anexos vinculados a chamado de outro cliente. A referência opcional à vistoria é somente preparação; não implementa integração ou alterações em vistorias. Orçamentos versionados, autorizações, prestadores, OS e financeiro terão tabelas próprias em etapas posteriores.

## Limites da migração preparada

`001_manutencao_base.sql` cria um schema novo em transação, falha se o nome já existe e restringe o tempo de espera por bloqueio. Não altera `properties`, `people`, vistorias, Auth, Storage, políticas existentes, privilégios globais ou configuração da Data API. Não insere dados. As revogações e a ativação de RLS se restringem aos objetos novos.

Nenhuma permissão de runtime é concedida, nem mesmo a `service_role`. Sem policies e com privilégios revogados, os papéis comuns não poderão usar as tabelas. O proprietário/administrador conserva poderes. **Este SQL não conecta a aplicação nem entrega o formulário público.** Ainda será necessário um backend com identidade, autorização por organização e acesso mínimo, ou outra migração de autorização revisada. Não adicionar o schema aos expostos da Data API como atalho. O backend precisará de conexão SQL adequada para acessar um schema não exposto; apenas a chave da Data API não fornece essa conexão.

RLS não protege contra proprietário, superusuário ou papel com bypass. O servidor deverá controlar organização, autoria, visibilidade, arquivos e operações permitidas. Revisão do chamado e `updated_at` deverão ser atualizados atomicamente com seu evento; o rascunho não cria gatilho nem garante sozinho histórico imutável. O protocolo não será senha de consulta pública. Não ligar dados reais às contas fictícias da demonstração.

Separação de schema reduz acoplamento, mas **não isola recursos do servidor nem garante risco zero**. DDL pode acionar event triggers já existentes; carga de manutenção também compartilhará CPU, conexões e armazenamento. Se esses riscos forem inaceitáveis, usar projeto/banco separado com sincronização controlada de imóveis é a alternativa de maior isolamento.

## Antes da aplicação

1. Confirmar projeto/ambiente administrativo e revisar `000_preflight.sql`, somente leitura. Verificar schema livre, papéis, função UUID, políticas e event triggers; obter inventário completo de permissões/dependências com a conexão administrativa. A Data API consultada não comprova esses itens.
2. Gerar backup do banco atual e dos arquivos necessários ao sistema antigo; confirmar uma restauração em ambiente separado. Não restaurar sobre produção para testar.
3. Aplicar o rascunho em cópia/teste. Comparar antes/depois a definição, políticas e privilégios das tabelas antigas. Testar no sistema de vistorias criação, recebimento, agendamento, checklist, atualização, conclusão e cadastro de imóveis/equipe, usando dados fictícios.
4. Verificar que `anon`, `authenticated` e `service_role` não ganharam acesso aos objetos novos; testar em transação a restrição entre organizações e os campos obrigatórios. Revisar efeitos de event triggers e consumo de recursos.
5. Só promover a alteração validada com acesso administrativo e plano de recuperação. Na produção, repetir leitura e fluxos não destrutivos do sistema existente. Não reutilizar o banco local fictício como fonte dos registros reais.

O rascunho recebeu revisão estática e passou posteriormente em **17 verificações no PostgreSQL 18.6 local (PGlite 0.5.10)** com dados fictícios. Produção usa PostgreSQL 17.6; serviços Supabase/event triggers não foram reproduzidos. A conferência administrativa real foi somente de leitura. O usuário confirmou não possuir backup com restauração testada; essa etapa e a regressão em cópia real continuam pendentes. Detalhes, evidências e login necessário no painel de backups em `CONFERENCIA-ADMINISTRATIVA.md`. Não houve aplicação remota.

## Reversão

Se houver falha antes do `COMMIT`, reverter a transação. Se os objetos tiverem sido criados, só remover o schema depois de confirmar que todas as quatro tabelas estão vazias, não há outros objetos/dependências, e o backend está desligado. Remover apenas os objetos novos conhecidos, sem `CASCADE`. Se houver chamados ou arquivos, preservar/exportar dados e preparar migração corretiva; não apagar histórico para “desfazer”. Backup completo é recurso de desastre, não uma reversão automática que sobrescreva o trabalho do outro sistema.

## Fontes e grau de evidência

- Usuário: semântica de `properties.code`, equipe em `people`, preservação do sistema existente e campos da futura entrada pública.
- Interface observada: [página de vistorias](https://visto-new.vercel.app/vistorias), somente leitura nesta sessão.
- Estrutura inicial: `estrutura-exposta.json`, recorte OpenAPI da Data API. Conferência administrativa posterior: `CONFERENCIA-ADMINISTRATIVA.md` e JSONs de catálogo/permissões, obtidos somente por leitura.
- Projeto proposto, ainda não implementado: separação de schema, quatro tabelas, vínculos lógicos e política inicial de acesso fechado.
- [PostgreSQL — CREATE TABLE / ações de FK](https://www.postgresql.org/docs/current/sql-createtable.html): restrições referenciais podem bloquear remoção da linha referenciada.
- [Supabase — schemas personalizados](https://supabase.com/docs/guides/api/using-custom-schemas): exposição pela Data API depende da configuração de schemas e permissões.
- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): privilégios e políticas são camadas distintas; chaves secretas autorizam papel que pode contornar RLS.
