# Supabase existente — mapeamento inicial para vistorias e manutenção

## Prioridade atual — 31/10/2026

O módulo local prioriza pedidos e agendamentos de vistorias e continua usando SQLite com contas de demonstração. Por autorização do usuário em 31/10/2026, foi feita leitura somente de `public.properties`; o catálogo local atual contém 417 imóveis, somente ID/código/endereço. A cópia foi montada do snapshot local de 404 imóveis mais 24 registros alterados após o snapshot (11 atualizados e 13 novos). Nenhuma tabela, linha ou permissão foi modificada no Supabase. Não houve importação de pessoas, contatos ou vistorias históricas. Isto é uma cópia local pontual, não uma integração ou sincronização; a conexão de produção continua dependendo de identidade da equipe e autorização por imobiliária.

**Atualização posterior — 31/10/2026:** a pedido do usuário, também foram copiadas localmente as nove pessoas ativas de `public.people`, somente ID, nome e papel; sem telefones ou e-mails (o esquema não tem campo de e-mail). Foram criados nomes de usuário locais e e-mails sintéticos `@local.invalid`; papel local mínimo `staff`. A senha inicial definida pelo usuário foi armazenada somente como hash com salt. O SQLite local agora reúne 417 imóveis e 9 pessoas reais mais os dados fictícios de demonstração. Não houve escrita no Supabase nem criação de contas Supabase Auth; não há sincronização. O login local aceita nome de usuário ou e-mail e permanece impróprio para produção.

**Atualização posterior — vistorias, 31/10/2026:** retrato somente de leitura da base atual: 859 `public.inspections`, 3.154 `public.inspection_status_events`, 14 pessoas (9 ativas, 5 inativas), 682 vistorias com início agendado e 233 itens de checklist. Foram copiados para SQLite os campos necessários à lista, agenda e histórico, sem telefones ou e-mails. Atribuições `created_by`/`assigned_to` foram preservadas; os cinco responsáveis inativos existem apenas como referências locais desabilitadas para login. 777 registros vinculam a imóveis atuais por código normalizado/endereço único; os restantes usam 74 cadastros históricos arquivados e ocultos dos seletores. Tipos e status foram mapeados explicitamente para o modelo local. O protocolo `HIST-####` é referência local criada na importação, não protocolo original.

O arquivo privado `data/inspections-snapshot-2026-10-31.json` contém o recorte local necessário, SHA256 `902E81ADC94B28FC9D3BCC135AB8AA83F2C534F84DF5F26F147BBF85736A3D3A`; `data/` permanece ignorado pelo Git. Backup SQLite antes da carga: `data/gestor-before-inspections-import.sqlite`, sem vistorias, integridade `ok`. Depois da carga: 859 vistorias, 3.154 eventos, integridade `ok`, sem violações de chave estrangeira. Nenhuma tabela, linha ou permissão foi modificada no Supabase. Os 233 checklists, duração/fim da agenda e 10 atribuições de marketing não foram importados porque ainda não há representação no painel local.

O plugin Supabase voltou a sinalizar risco crítico: RLS desativado em sete tabelas públicas, incluindo `people`, `inspections`, `properties`, `inspection_status_events` e tabelas de checklist; o aviso informa que `anon`/`authenticated` podem ler ou alterar linhas pela Data API. Nenhuma policy foi criada ou alterada para preservar o contrato do sistema antigo. Exige revisão separada antes de expor a aplicação.

## Estado atual — 19/10/2026, após aplicação

A base privada de manutenção foi criada no projeto `novabase`, migração `20261020022640_gestor_manutencao_base_privada`. Existem quatro tabelas novas em `gestor_manutencao`, vazias, com RLS ativo e sem USAGE/acesso de leitura para anon, authenticated e service_role. Não foram expostos schemas novos na Data API. Não há FK para tabelas antigas.

O usuário autorizou a cópia local e, especificamente, a passagem dos dados das oito tabelas pelo plugin/agente. A gravação foi direta por ferramenta de arquivos, sem transportar registros pelo terminal. A cópia das oito tabelas foi restaurada no PostgreSQL 17.11 local, convertida em arquivo nativo e restaurada novamente. Todos os 4.489 registros coincidiram em três comparações completas, incluindo após testar a manutenção na cópia. O servidor local foi encerrado.

Essa recuperação cobre as oito tabelas do aplicativo e os objetos públicos observados necessários à restauração; não é backup completo dos serviços/configurações do projeto Supabase. A metadata foi coletada separadamente das linhas. O snapshot de linhas é consistente em uma única transação. Arquivos privados em `backups/supabase/20261020T021543Z-aplicativo-19a54295`, fora do Git e com ACL restrita. Nenhuma senha do Supabase foi salva ou redefinida.

Na produção, colunas, defaults, função, gatilhos, RLS, proprietários, grants, constraints, índices e policies das tabelas antigas foram conferidos sem diferenças. A migração só criou objetos novos. A aplicação Gestor Imob inclui agora um fluxo local de pedido/agendamento de vistoria em SQLite/dados fictícios; identidade, autorização e adaptador para o banco real ainda precisam ser implementados. Não ligar dados reais às contas fictícias de demonstração. Não houve teste completo da interface do sistema antigo contra uma cópia, apenas fluxo SQL e verificações de dados/estrutura.

Evidência atual: `supabase/EXECUCAO-MANUTENCAO.md`, `supabase/execucao-verificada.json` e relatório de restauração. As seções abaixo registram o levantamento/plano anteriores; referências a pendências de login, senha, backup ou aplicação devem ser lidas em sua ordem histórica.


Observação em **19/10/2026**, America/Sao_Paulo, equivalente ao horário UTC do artefato JSON. Projeto: Gestor Imob. Estado: inspeção concluída, integração da aplicação ainda não implementada.

## Acesso e evidência

Data API do projeto informado pelo usuário respondeu HTTP 200 ao documento OpenAPI. Foram utilizados apenas GET do esquema e HEAD para contagem da tabela de imóveis. A chave foi recebida em memória pela entrada sem eco do processo, sem passar em argumentos de shell, URLs ou arquivos. Não há credencial neste relatório.

Não houve SELECT de nomes, telefones, endereços ou outros valores de pessoas/imóveis; nenhuma linha com dados pessoais foi baixada. Não foram chamadas RPCs, gravados registros, alterados schemas, políticas ou autenticação. O arquivo `supabase/estrutura-exposta.json` contém somente nomes, tipos, chaves descritas pela API e metadados da consulta.

Esse inventário cobre **as tabelas expostas na API para o papel consultado**, não todo o catálogo PostgreSQL. Não valida RLS, grants, unicidade, gatilhos ou regras de negócio. Relações abaixo são as descritas pelo OpenAPI, não uma auditoria de todas as relações existentes.

## Tabelas encontradas

| Tabela | O que foi comprovado pela estrutura | Uso possível / limite |
|---|---|---|
| `properties` | Chave UUID; `code`, `code_normalized`, `address`, timestamps e campos separados de rua, número, complemento, bairro e cidade. | Melhor candidato a cadastro compartilhado de imóveis. Código pode mudar; usar UUID como referência. Não aparecem campos próprios de CEP/UF, titular, proprietário ou locação nesse objeto. Não examinamos valores de endereço para avaliar completude. |
| `people` | UUID, nome, papel textual, ativo, criação e telefone. Referenciada como autor/responsável de vistoria e pessoa da agenda de trabalho. | **Confirmação direta do usuário:** contém apenas equipe e vistoriadores. Não usar como cadastro de inquilinos. A relação com Auth e as permissões de acesso continuam sem validação. |
| `inspections` | Tipos/situações de vistoria, responsáveis em `people`, código/endereço do imóvel, agendamento, recebimento e conclusão. | Confirma estrutura de vistorias; conservar o módulo existente. Não desenvolver vistorias no Gestor Imob agora. |
| `inspection_checklist_items` | Itens com referência à vistoria, conclusão e responsáveis em `people`. | Não confundir checklist de vistoria com chamado de reparo. |
| `inspection_status_events` | Transições de vistoria e autoria em `people`. | Histórico do módulo existente; não é histórico de manutenção. |
| `default_checklist_items` | Itens padrão, ativo e ordenação. | Conteúdo de vistoria, fora do escopo de construção atual. |
| `work_schedules` | Referência à pessoa e horários de trabalho/intervalo. | Compatível com equipe/vistoriadores, função confirmada pelo usuário; não comprova disponibilidade de prestadores de manutenção. |
| `__codex_probe` | Um campo inteiro `id`; já estava presente no esquema retornado. | Finalidade desconhecida. Não foi criada, utilizada ou alterada nesta inspeção. |

A contagem de `properties` respondeu `Content-Range: 0-403/404` em HEAD com `Prefer: count=estimated`. Registrar como **404 informados pela API no modo estimado**, sem tratar como auditoria de imóveis ativos, únicos ou endereços completos. Cabeçalho não representa download de 404 registros.

Não foram vistos endpoints RPC no OpenAPI. Não foi observada uma chave estrangeira de `inspections` para `properties`: o esquema exposto contém código/endereço do imóvel na vistoria. A associação efetiva precisa ser confirmada no código/regra atual, sem supor que códigos sejam únicos.

## Mapeamento proposto — ainda não aplicado

### Regra confirmada pelo usuário em 19/10/2026

O campo `properties.code` é o código de registro do imóvel no sistema da imobiliária, e a tabela guarda o endereço desse imóvel. Fonte: esclarecimento direto do usuário após a inspeção. Isso confirma a função de negócio desse cadastro; não comprova por si só uma restrição de unicidade no banco.

O chamado pode ser vinculado ao UUID `properties.id`, exibindo o código da imobiliária e o endereço para a equipe. Código é referência de negócio; UUID é a referência técnica proposta. Na abertura pública, nome do titular/solicitante e contato podem ser coletados como declarações e o vínculo ao imóvel conferido na triagem. Não é necessário concluir um cadastro completo de locações antes de construir essa entrada; ela pode registrar “vínculo à locação pendente de conferência”.

Não expor uma lista pública de imóveis ou nomes de moradores. Código e endereço ajudam a localizar o imóvel, mas não comprovam identidade nem concedem acesso ao histórico. Casos sem correspondência ou com mais de um candidato permanecem para análise da equipe.

| Necessidade do Gestor Imob | Fonte candidata | Próxima definição |
|---|---|---|
| Imóvel | `properties.id`, `code` e campos de endereço | Função do código confirmada pelo usuário: registro do imóvel na imobiliária. Adaptador de leitura com UUID estável; nunca substituir IDs fictícios silenciosamente por reais. |
| Titular, proprietário e locação | Não identificados como entidades específicas no recorte | Coletar nome/contato declarados na abertura e conferir vínculo internamente. Localizar outra fonte/modelar vigência como evolução; não presumir que pessoas da equipe sejam inquilinos. |
| Equipe / responsável interno | `people`, confirmada pelo usuário como equipe/vistoriadores | Conferir papéis, relação com Auth e autorização antes de reutilizar. |
| Chamados, orçamentos, autorizações, OS e custos | Novas entidades próprias de manutenção | Especificar e revisar migração separada, com organização e políticas. Nenhuma tabela foi criada. |
| Vistoria futura como origem | Referência opcional à vistoria/constatação | Manter integração futura, sem dependência obrigatória e sem alterar o módulo existente. |

## Sequência recomendada

1. Usar a semântica confirmada: código e endereço de `properties`, com UUID para vínculo técnico. A leitura local autorizada em 31/10 confirmou 417 IDs e códigos normalizados únicos; a demonstração continua sem integração ao vivo.
2. Conferir autenticação, organização, políticas e a regra de identificação do imóvel antes de compartilhar dados.
3. Preparar um ambiente separado da demonstração, com usuários próprios e acesso controlado. O painel atual tem contas e senha fictícias divulgadas no README; **não conectar os dados reais a essas contas**.
4. Desenvolver o adaptador de leitura de imóveis e um plano de migração para manutenção, validado em cópia/ambiente de teste. Manter os registros atuais do outro sistema preservados.
5. Implementar a entrada pública com nome/contato declarados e identificação do imóvel para triagem, sem listar a carteira nem liberar consulta ao histórico apenas pelo nome/endereço. A normalização completa de locações pode evoluir depois. A função de equipe/vistoriadores em `people` foi confirmada pelo usuário; validar identidade de acesso antes de reutilizar. Não representa titulares de locação.

## Preservação do sistema existente e endereço informado

O usuário confirmou que o banco está em uso por seu outro sistema e deve ser preservado. O endereço `https://visto-new.vercel.app/vistorias` abriu “Alice Imóveis Vistorias” em modo de consulta, com filtros, Lista/Kanban, prazos, agenda e checklist. Não foi selecionado usuário nem alterado registro. A interface exibiu dados reais; a declaração de não baixar linhas pessoais acima refere-se à inspeção anterior de metadados pela Data API, não a essa visualização posterior. A página por si só não comprova associação ao mesmo projeto Supabase nem as regras de autenticação/RLS.

Proposta local em `supabase/PLANO-MANUTENCAO.md`: schema próprio `gestor_manutencao`, inicialmente sem acesso dos papéis comuns, tabelas de organizações, chamados, eventos e metadados de anexos. Referências a imóveis/equipe/vistorias serão lógicas, sem FKs ou gatilhos nas tabelas antigas. Isso evita acoplar a exclusão de imóveis do sistema atual à existência de chamados. O rascunho `supabase/001_manutencao_base.sql` **não foi aplicado remotamente; posteriormente passou em 17 verificações em PostgreSQL 18.6 local (PGlite)**; exige backup/restauração em teste, auditoria administrativa e regressão do sistema atual. Nenhuma configuração existente deve ser modificada para expor o módulo como atalho.

## Conferência administrativa após conexão do plugin — 19/10/2026

Projeto confirmado pela listagem: `novabase`, referência correspondente ao URL informado, PostgreSQL 17.6. Foram executadas consultas de catálogo em transações somente de leitura e consultado o Security Advisor. Nenhum registro de negócio foi selecionado; nenhuma migração, dado ou permissão remota foi alterado. O schema `gestor_manutencao` ainda não existe. Papéis e função UUID estão disponíveis.

Foi confirmada `UNIQUE (code_normalized)` em `properties`, além da PK UUID. Isso não equivale a garantia sobre o texto literal de `code` ou sobre como a aplicação normaliza o valor. Os seis event triggers habilitados tiveram suas definições administrativas revisadas; há notificações de recarga do PostgREST e funções condicionadas a extensões. Nenhum desses objetos foi modificado.

RLS está desativado em sete tabelas de `public`, com grants amplos para `anon`/`authenticated`. `work_schedules` tem RLS ativo, mas sua policy permite `TO public` com condições verdadeiras. O Advisor confirmou os sete casos e dois avisos adicionais. Não corrigir em conjunto com manutenção sem analisar o aplicativo atual: ele pode depender dessas permissões.

O rascunho foi executado com dados fictícios no PGlite 0.5.10 / PostgreSQL 18.6 local: **17 verificações aprovadas**. Isso não reproduz o PostgreSQL 17.6 gerenciado, os serviços Supabase, os event triggers ou o site de vistorias contra cópia real. Não equivale a teste de restauração. Resultado detalhado e links de diagnóstico em `supabase/CONFERENCIA-ADMINISTRATIVA.md`.

O usuário informou que ainda não tem backup com restauração testada. A área de backups do painel pediu login; o plugin conectado não autentica essa sessão do navegador. Não foi gerado backup, criado branch ou aplicado DDL remoto. Próximo passo: obter recuperação verificada em destino separado e testar o sistema antigo nessa cópia antes de aplicar a estrutura.

## Credenciais e limitações

Nenhuma chave fornecida foi salva no código, Git, relatório ou cofre. A chave secreta deve ser substituída por ter sido compartilhada no chat. Primeiro atualizar os sistemas que a utilizam e depois revogar a antiga, evitando interromper o outro aplicativo. Não é necessário enviar a nova chave no chat.

Segundo a [documentação de chaves do Supabase](https://supabase.com/docs/guides/getting-started/api-keys), chaves secretas são de backend e possuem acesso elevado, contornando RLS. Não usar uma chave secreta no formulário público. Uma chave publicável, isoladamente, não identifica o inquilino nem autoriza acesso à sua locação.

Conectividade de inspeção confirmada não equivale a integração funcional: o Gestor Imob permanece com o banco local de demonstração, sem chamadas ao Supabase em seu código de aplicação.

## Atualização — equipe trazida da fonte antiga para o sistema novo, 31/10/2026

Fonte lida somente para consulta: novabase, tabela public.people; campos id, name, role e active. Destino: banco local do Gestor Imob em data/gestor.sqlite. Os 14 registros da fonte já existiam no destino; IDs, nomes e situação ativa/inativa coincidem. Não foi necessária inclusão de novas contas.

As nomenclaturas da origem foram traduzidas para o campo local de cargo: manager → Gerente (9 pessoas), attendant → Atendente (2), assistant → Assistente (1), inspector → Vistoriador (1). O único registro marketing está inativo e permanece como A definir. A origem não distingue Gestora de Gerente; manager foi importado como Gerente e pode ser corrigido individualmente no painel novo.

O cargo não altera o perfil local de acesso; nenhuma senha, usuário de login, papel de acesso ou situação foi modificada. Telefone e e-mail não foram consultados nem copiados. Backup antes da atualização local: backups/gestor-2026-10-31T21-02-46-545Z-498a7c. Depois da gravação, integrity_check retornou ok; a organização local continua com 17 contas, 9 ativas. Nenhuma escrita foi feita no Supabase.

A aba de prévia ainda aponta para uma instância anterior na porta 4173; a base do sistema novo está atualizada, mas a tela exige reiniciar o servidor local para mostrar os dados.
## Atualização — equipe importada isolada das contas fictícias, 31/10/2026

A consulta administrativa do sistema novo agora omite as três contas seed com e-mail @demo.local, sem removê-las do banco, e mantém visíveis as 14 pessoas da fonte antiga (9 ativas, 5 inativas). Das 14, 13 receberam cargo traduzido a partir de public.people.role; a pessoa de marketing permanece A definir. A conferência read-only retornou 14 contas visíveis, 9 ativas, 13 com cargo; node --check server/service.js passou.

A inicialização atual não conseguiu usar 127.0.0.1:4173 porque a porta está ocupada. Não encerrei processo não identificado. A lista e os cargos estão no banco e no código do Gestor Imob novo; para visualizar, parar o servidor que ocupa a porta e iniciar Iniciar_Gestor_Imob.cmd nesta pasta. Nenhuma escrita foi feita no sistema de origem.