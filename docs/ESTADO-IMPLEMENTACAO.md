# Estado da implementação local

Data de referência: 31/10/2026. Aplicação local SQLite com dados de demonstração e cópias locais de imóveis/equipe reais, sem conexão ao vivo. Vistorias seguem como operação principal e pedidos internos de confecção de contratos foram adicionados; o painel de manutenção permanece como protótipo secundário. **Não está pronta para uso em produção.**

## Implementado neste recorte

| Área | Comportamento implementado |
|---|---|
| Acesso | Login por usuário ou e-mail, sessão de 8 horas, encerramento, três papéis internos e escopo de organização na API. Painel local restrito à Gestão para criar/editar contas, definir função, situação e senha. Inativação preserva histórico e revoga sessões; a API impede retirar o último administrador ativo. Nove pessoas importadas continuam como `staff`; não há autenticação Supabase. |
| Visão geral | Contadores obtidos dos registros, fila de atenção, próximos agendamentos e navegação para os respectivos registros. |
| Vistorias | Pedido com protocolo, imóvel e snapshot do código/endereço, tipo, solicitante interno, prazo, vistoriador, duração prevista e horário; Kanban padrão (Nova em destaque), lista opcional, filtros, agenda mensal de itens ativos, tema claro/escuro e histórico. Propostas ficam em Nova até o vistoriador designado aceitar; horários por vistoriador não se sobrepõem, são bloqueados também enquanto aguardam aceite e respeitam 08:00–11:00 e 13:00–18:00. Conflitos mostram até três sugestões livres. A duração é sugerida pelo histórico do mesmo imóvel/tipo ou pela mediana histórica do tipo. Ao passar para Concluída, o sistema cria aviso interno para a pessoa solicitante; na vistoria há um link que prepara a mensagem de WhatsApp para revisão manual, sem envio automático. Não há avisos retroativos para conclusões importadas. Canceladas, concluídas e finalizadas ficam ocultas no Kanban/lista padrão e itens encerrados também saem da agenda ativa. A equipe pode cadastrar imóvel no pedido; o código SAMI permanece associado ao imóvel e ao snapshot. |
| Contratos | Gestão cria pedido de ocupação, aditivo ou outro motivo manual, ligado ao imóvel compartilhado com vistorias. Data da solicitação e autor vêm da sessão/relógio do servidor; o pedido preserva código/endereço, prazo, dados adicionais e histórico. Gestão/Atendimento iniciam a confecção, justificam atraso e enviam à gestora; o envio grava data/hora do sistema e cria aviso interno ao solicitante. Prazos vencidos e prazos do dia aparecem como alerta no painel; atrasos sem justificativa são destacados. |
| Chamados | Cadastro interno, protocolo, descrição, solicitante/contato, origem, categoria, prioridade, prazo e snapshot do titular/endereço. Busca, filtros, detalhe e transições de acompanhamento. |
| Cadastros | Inclusão de imóvel para vistoria com código SAMI e endereço estruturado (rua, número, complemento, bairro e cidade); inclusão de prestador. Consulta ao histórico por imóvel e agenda por prestador. |
| Conversa | Notas com público identificado. Todos os registros permanecem internos; não há entrega por e-mail, WhatsApp ou portal. |
| Orçamentos | Itens em centavos, versões sequenciais, substituição de propostas anteriores e registro de resposta externa com autorizador, autoria da equipe e referência. Sem assinatura digital. |
| OS | Visita diagnóstica com autorização/custo próprios; execução/retorno vinculados à versão aprovada e mesmo prestador/escopo. Agenda, atualização e conclusão com referência de evidência ou justificativa sem foto. |
| Encerramento | Solução obrigatória, bloqueio de encerramento com OS pendente, confirmação registrada e reabertura com motivo. |
| Financeiro | Despesa com pagador único, valor/saldo, registro de pagamento externo parcial/total e evento. Não há cobrança ou transferência. |
| Anexos | JPEG, PNG, WebP ou PDF até 5 MB, assinatura básica do arquivo, armazenamento local privado e download autenticado da organização. Não há antivírus ou análise profunda de arquivo. |
| Relatórios | Quantidades por categoria, custos e saldos do histórico inteiro; CSV geral sem notas internas, com neutralização de fórmulas. Não há filtro de período do relatório ou exportação dos filtros da tela. |
| Recuperação | Backup do banco e anexos com o servidor parado, manifesto de hashes e verificação de integridade. Teste automatizado recupera banco e conteúdo do arquivo. |

## Limitações antes de completar P0

- O painel local cobre cadastro/edição e papéis fixos, mas não há convite por e-mail, recuperação pelo próprio usuário, troca obrigatória de senha no primeiro acesso, MFA, perfil distinto de vistoriador/gestor ou alçadas por valor. As contas continuam locais, sem sincronização ou autenticação Supabase.
- Pessoas, proprietários, unidades e locações precisam de normalização e vigência. Hoje o cadastro mínimo concentra campos e o chamado preserva o snapshot da abertura.
- Ainda não há edição/inativação de cadastros, verificação assistida de duplicados, rascunho sem imóvel, triagem de área comum flexível ou medição de SLA/primeira resposta.
- Uma nova versão de orçamento substitui as anteriores: comparação simultânea entre vários fornecedores fica para evolução. OS já emitida preserva a autorização histórica do seu escopo.
- Autorização externa é um registro feito pela equipe, não clique autenticado do proprietário. Uma justificativa textual não substitui a comprovação exigida pela operação.
- Ainda faltam instruções de acesso ao imóvel, reagendamento, anexos selecionados para cada OS, rateio, edição/contestação financeira e comprovante ligado diretamente ao pagamento.
- Não existem públicos externos na API; notas e anexos são internos. A concessão específica por público precisa ser implementada antes dos portais externos.
- Contratos controlam o pedido e seu encaminhamento; não geram minuta jurídica, não coletam assinatura e não enviam documentos fora do painel. Informações adicionais são texto livre; ainda não há campos jurídicos estruturados por tipo.
- Vistorias ainda não incluem checklist, laudo, comparação entrada/saída, mapa, fotos ou envio externo. O calendário é local e não sincroniza com provedores externos.
- A tela usa retratos locais de `properties`, `people`, `inspections` e histórico de situação; não há sincronização, checklist ou autenticação Supabase conectada.
- Notificações continuam internas; o link do WhatsApp apenas prepara uma mensagem para revisão e escolha do destinatário, sem envio automático. Não há entrega por e-mail, gateway de pagamento ou marketplace.
- O histórico e a revisão evitam edição perdida no acompanhamento, mas a auditoria ainda compartilha o mesmo banco da aplicação. Não se trata de armazenamento inviolável.
- SQLite e servidor HTTP são uma base local. Operação hospedada exige TLS, credenciais próprias, configuração de implantação, monitoramento e revisão de segurança/escala.

## Verificação

`npm.cmd test` cobre isolamento de organizações e referências para chamados e vistorias; papéis de acesso, criação/agendamento/transições e histórico de vistoria; diagnóstico antes do orçamento; invalidação de aprovação antiga; edição concorrente; sessão, CSRF, anexos, exportação e recuperação do conteúdo de anexo.

Antes da migração SQLite aditiva, foi criado o backup local `backups/gestor-2026-10-31T17-29-27-006Z-08a74c`. `PRAGMA integrity_check` retornou `ok` antes/depois; as contagens das 11 tabelas antigas coincidem exatamente (2 organizações, 4 usuários, 6 imóveis, 4 prestadores, 8 chamados, 2 orçamentos, 2 OS, 0 notas, 12 eventos, 2 custos e 0 anexos). As duas tabelas novas estavam vazias após a migração. A prévia visual não foi validada porque o navegador da ferramenta não alcançou o servidor local; as verificações de API e regras passaram.

Testes locais não estabelecem prontidão de produção.

## Atualização — login e equipe local, 31/10/2026

O login aceita nome de usuário ou e-mail, com busca sem distinção entre maiúsculas/minúsculas. Os nove usuários ativos importados de `public.people` têm nome de usuário gerado localmente; o cadastro de origem não tem e-mail, então foram atribuídos e-mails sintéticos `@local.invalid`, sem envio de mensagens. Todos foram adicionados com papel mínimo `staff`. As senhas configuradas ficam em hashes individuais com salt; nenhum valor em texto foi registrado nesta documentação.

Migração SQLite aditiva em `server/database.js`, preservando as quatro contas de demonstração e as 13 contas já existentes. Backup anterior em `data/gestor-before-username-login.sqlite`; `PRAGMA integrity_check` retornou `ok` e a cópia manteve as 13 contas. Não houve gravação no Supabase. Verificação executada: análise sintática dos três arquivos alterados e integridade/estrutura SQLite; a suíte de testes não foi executada nesta atualização.

## Atualização — vistorias reais locais, 31/10/2026

Importado para a cópia SQLite um retrato somente de leitura do projeto Supabase: 859 vistorias, 3.154 eventos de situação e 682 horários de início agendados. Os tipos `placa_fotos` e `manutencao` e os status `awaiting_contract`/`canceled` são preservados por mapeamento explícito. Cinco pessoas inativas foram adicionadas apenas como referências históricas desabilitadas para login. 777 vistorias foram vinculadas a imóveis atuais por código normalizado ou endereço único; as demais apontam para 74 imóveis históricos arquivados, que não aparecem como opção de cadastro.

Backup anterior à migração/importação: `data/gestor-before-inspections-import.sqlite`, 0 vistorias, integridade `ok`. Após a carga: 859 vistorias, 3.154 eventos, 0 problemas de chave estrangeira e integridade `ok`. O retrato local `data/inspections-snapshot-2026-10-31.json` tem SHA256 `902E81ADC94B28FC9D3BCC135AB8AA83F2C534F84DF5F26F147BBF85736A3D3A`. Nenhuma escrita foi feita no Supabase.

Fora desta carga: 233 itens de checklist e as 10 atribuições de marketing. A duração e o fim foram acrescentados apenas ao SQLite local: 653 linhas reaproveitaram a duração do registro histórico correspondente; 29 receberam a mediana concluída do tipo (desocupação 60 min, ocupação 60 min, revistoria 45 min, visita 30 min). Os horários de início existentes não foram alterados. O app continua sendo uma cópia local pontual, sem sincronização e sem prontidão para produção. A suíte automatizada não foi executada nesta atualização.

## Atualização — fluxo visual de vistorias, 31/10/2026

Adicionados tema claro/escuro (preferência salva neste navegador e tema inicial compatível com o sistema), Kanban como visualização inicial e destaque da coluna Nova. No pedido de vistoria, admin e atendimento podem abrir o cadastro de imóvel sem perder o rascunho; após salvar, o pedido reabre com o imóvel selecionado. A rota de criação autoriza somente admin/atendimento para imóveis; demais catálogos mantêm a autorização anterior. O código inserido é guardado como texto SAMI e copiado para o snapshot da vistoria, sem gerar novo identificador.

Conferência local em 31/10/2026: painel carregou os 859 registros, Kanban abriu com Nova primeiro e em destaque; usuário staff abriu o cadastro de imóvel e Cancelar restaurou o pedido. Temas claro e escuro foram alternados visualmente e a exibição escura foi restaurada ao final (e ficou salva neste navegador). Nenhum imóvel ou pedido foi gravado nesta conferência; nenhuma chamada de escrita ao Supabase foi feita. `node --check` passou para `public/app.js` e `server/service.js`; não foi executada a suíte automatizada.

## Correção visual do tema escuro — 31/10/2026

Após o retorno do usuário, substituí o verde dominante por superfícies grafite, aumentei o contraste de textos e controles, escureci ilustrações de imóveis e avatares e removi o fundo retangular do menu lateral. Corrigi também o seletor do Kanban: o círculo aplica-se apenas ao contador, não ao texto do cabeçalho. Revisão visual local em Vistorias, Visão geral, Agenda, Imóveis e Relatórios; a preferência escura ficou ativa. Nenhum dado foi gravado e nenhuma integração remota foi usada. A suíte automatizada não foi executada.

## Cadastro de imóvel alinhado ao Supabase — 31/10/2026

Consulta somente de leitura confirmou em `public.properties` os campos `property_street`, `property_number`, `property_complement`, `property_neighborhood` e `property_city`; a cidade aceita Taquara, Parobé ou Igrejinha. O formulário local mantém o código SAMI e pede rua e cidade; número, complemento e bairro são opcionais. A validação repete no servidor os limites e as cidades aceitas.

No SQLite local, uma migração aditiva criou colunas com os mesmos nomes. Os 497 registros anteriores não foram preenchidos por inferência: a contagem e o hash dos campos antigos ficaram idênticos; `PRAGMA integrity_check` retornou `ok` e `foreign_key_check` não encontrou problemas. Backup privado anterior: `backups/gestor-2026-10-31T20-04-29-420Z-a7b809`. Nenhum dado ou schema remoto foi alterado.

O painel mostrou o formulário com os novos campos; não foi enviado nenhum cadastro. A porta local 4173 estava ocupada e não foi possível reiniciar a instância; por isso, a gravação ponta a ponta com o servidor atualizado ainda precisa ser conferida após reiniciá-lo. A suíte automatizada não foi executada.

## Atualização — painel de equipe local, 31/10/2026

O painel de equipe ficou disponível somente para o perfil Gestão. Permite criar/editar conta, nome de usuário, e-mail, perfil (Gestão, Atendimento ou Financeiro), senha e situação ativa/inativa. Senhas são armazenadas com hash e salt; não há envio de convite. E-mail pode ficar vazio, usando identificador local `@local.invalid`.

A API limita a leitura e as alterações à organização da sessão e ao perfil admin; devolve apenas campos não secretos. Troca de função, senha ou situação revoga as sessões do usuário; a última conta ativa de Gestão não pode ser removida nem rebaixada. Inativar preserva referências históricas.

Escopo e validação: código local/SQLite, sem alteração no Supabase. `node --check` passou em `public/app.js`, `server/service.js` e `server/http.js`. A tela do painel foi conferida visualmente em uma sessão de demonstração isolada; a instância que respondeu à prévia mostrou lista vazia, sem os dados administrativos novos, apesar de a cópia local conter contas. Nenhuma conta foi criada ou alterada. A listagem e gravação ponta a ponta dependem de reiniciar a instância para carregar o backend atualizado. A suíte automatizada não foi executada.

Limite: os perfis são os três já existentes; não foi criado perfil separado de vistoriador ou gestor. A aplicação continua restrita ao ambiente local e não está pronta para produção.
## Atualização — acesso de Gestão com a conta Leonardo, 31/10/2026

A conta local leonardo na organização aurora recebeu o perfil Gestão usando o fluxo de atualização já existente, sem alterar sua senha. As três contas semeadas para demonstração nessa mesma organização foram inativadas; os registros históricos foram mantidos e as sessões dessas contas revogadas. A conferência após a gravação encontrou uma única Gestão ativa, zero contas @demo.local ativas na organização e três contas demonstrativas inativas.

Antes da mudança, o script do projeto criou e conferiu o backup backups/gestor-2026-10-31T20-40-09-493Z-b70678, incluindo banco SQLite, anexos referenciados, manifesto e verificação de integridade. A interface não oferece mais o atalho de acesso demonstrativo; o login segue aceitando usuário ou e-mail e senha. A navegação e a API de Equipe continuam limitadas a Gestão.

O runtime local continua sem integração Supabase e não está pronto para produção. A suíte automatizada não foi executada; não houve alteração remota nem mudança de senha. A organização demonstrativa separada horizonte permaneceu isolada e sem alteração.

## Conferência da prévia após o ajuste

A aba existente em 127.0.0.1:4173 continuou mostrando uma sessão antiga (Marina e Equipe vazia), portanto não foi usada para validar o novo acesso. A porta 4173 recusou a nova instância; uma tentativa temporária em 4174 iniciou, mas o navegador embutido não alcançou essa porta e o processo temporário foi encerrado. Nenhum processo desconhecido foi encerrado. Para carregar esta versão no computador, parar o servidor antigo com Ctrl+C e iniciar Iniciar_Gestor_Imob.cmd nesta pasta. Não houve alteração de senha nem escrita no Supabase.
## Atualização — lista da Equipe e nomenclaturas, 31/10/2026

Consulta somente de leitura ao SQLite local encontrou 17 contas na organização aurora (9 ativas e 8 inativas). A conta leonardo é Gestão ativa. O serviço Service.adminUsers lista todas as contas da organização; /api/state inclui essa lista para quem tem perfil admin. A tela antiga convertia uma lista ausente em array vazio e mostrava “Nenhum usuário cadastrado”, mascarando uma versão de servidor desatualizada.

Na interface local, alterei a página Equipe para sinalizar que a lista não foi carregada e orientar a reinicialização do servidor. A lista continua mostrando contas ativas e inativas para que a Gestão possa revisar função e situação. node --check passou em public/app.js, server/http.js e server/service.js; não executei testes automatizados nem alterei banco ou Supabase nesta etapa.

A aba aberta continuou ligada à versão antiga em 127.0.0.1:4173; não foi possível substituir o processo de origem deste ambiente. Depois de parar o servidor antigo, iniciar Iniciar_Gestor_Imob.cmd em E:\Novos projetos\Gestor_imob. Pendência de produto: confirmar se “nomenclatura” significa cargo livre por pessoa ou novos perfis que alterem acessos.
## Atualização — cargos da equipe no painel, 31/10/2026

Após o usuário indicar as nomenclaturas Gestora, Gerente, Atendente, Assistente e Vistoriador, adicionei o campo Cargo / nomenclatura à lista e à edição/criação de usuários. O campo é separado do perfil de acesso (Gestão, Atendimento ou Financeiro), portanto um título não concede permissões. Não atribuí cargos às pessoas por inferência; cada linha existente começa como A definir até a Gestão escolher.

Migração SQLite aditiva cria users.job_title com valor vazio padrão e preserva os registros. O serviço valida o texto (até 80 caracteres), devolve a coluna apenas na lista administrativa, e conserva o cargo atual quando um cliente antigo não envia esse campo. A lista segue restrita à Gestão e à organização da sessão.

Backup antes da migração: backups/gestor-2026-10-31T20-53-45-427Z-712fd6. A base local mantém 17 contas nessa organização, 9 ativas e 8 inativas. Nenhuma conta recebeu novo cargo nesta etapa; nenhum dado do Supabase foi alterado. A aba aberta continua no servidor antigo na porta 4173 e precisa ser recarregada depois de reiniciar o servidor desta pasta.
## Atualização — equipe trazida da fonte antiga para o sistema novo, 31/10/2026

Fonte lida somente para consulta: novabase, tabela public.people; campos id, name, role e active. Destino: banco local do Gestor Imob em data/gestor.sqlite. Os 14 registros da fonte já existiam no destino; IDs, nomes e situação ativa/inativa coincidem. Não foi necessária inclusão de novas contas.

As nomenclaturas da origem foram traduzidas para o campo local de cargo: manager → Gerente (9 pessoas), attendant → Atendente (2), assistant → Assistente (1), inspector → Vistoriador (1). O único registro marketing está inativo e permanece como A definir. A origem não distingue Gestora de Gerente; manager foi importado como Gerente e pode ser corrigido individualmente no painel novo.

O cargo não altera o perfil local de acesso; nenhuma senha, usuário de login, papel de acesso ou situação foi modificada. Telefone e e-mail não foram consultados nem copiados. Backup antes da atualização local: backups/gestor-2026-10-31T21-02-46-545Z-498a7c. Depois da gravação, integrity_check retornou ok; a organização local continua com 17 contas, 9 ativas. Nenhuma escrita foi feita no Supabase.

A aba de prévia ainda aponta para uma instância anterior na porta 4173; a base do sistema novo está atualizada, mas a tela exige reiniciar o servidor local para mostrar os dados.
## Atualização — equipe importada isolada das contas fictícias, 31/10/2026

A consulta administrativa do sistema novo agora omite as três contas seed com e-mail @demo.local, sem removê-las do banco, e mantém visíveis as 14 pessoas da fonte antiga (9 ativas, 5 inativas). Das 14, 13 receberam cargo traduzido a partir de public.people.role; a pessoa de marketing permanece A definir. A conferência read-only retornou 14 contas visíveis, 9 ativas, 13 com cargo; node --check server/service.js passou.

A inicialização atual não conseguiu usar 127.0.0.1:4173 porque a porta está ocupada. Não encerrei processo não identificado. A lista e os cargos estão no banco e no código do Gestor Imob novo; para visualizar, parar o servidor que ocupa a porta e iniciar Iniciar_Gestor_Imob.cmd nesta pasta. Nenhuma escrita foi feita no sistema de origem.

## Agenda com duração, bloqueio e aceite — 31/10/2026

Na cópia SQLite local, acrescentei `duration_minutes` e `scheduled_end`. De 682 vistorias com início agendado, 653 reaproveitaram a duração do retrato histórico correspondente por ID, tipo e código do imóvel; 29 usaram a mediana de vistorias concluídas/finalizadas do mesmo tipo. Fallbacks: desocupação 60 min (8 linhas), ocupação 60 min (12), revistoria 45 min (7), visita 30 min (2). Os horários de início e os demais registros não foram alterados.

Novas propostas validam vistoriador ativo com cargo Vistoriador, duração em blocos de 15 minutos (15–480), expediente 08:00–11:00 e 13:00–18:00, e sobreposição por intervalo dentro de `BEGIN IMMEDIATE`. Propostas também bloqueiam o intervalo; somente a pessoa designada pode aceitar. Se a Gestão mudar um horário aceito, ele volta a aguardar aceite. Recusa libera a vaga sem apagar o histórico. Um conflito retorna até três horários livres nos próximos 14 dias. Como não foi definido expediente por dia da semana, a sugestão ainda pode cair em sábado ou domingo.

A agenda mostra apenas pedidos novos, aceitos ou em andamento; três contadores mostram em aberto, em andamento e atrasados, considerando apenas prazos informados. Conclusão continua gerando aviso interno à pessoa solicitante. O detalhe da vistoria concluída oferece um link `wa.me` com texto pré-preenchido, sem telefone copiado, disparo automático ou envio até revisão/ação manual da equipe.

Backup pré-mudança verificado em `backups/gestor-2026-10-31T22-04-58-130Z-3a026e`. Após o preenchimento, `PRAGMA integrity_check` retornou `ok`; as 682 agendas têm fim e duração; o início agendado foi preservado; a conferência do histórico existente encontrou zero pares sobrepostos. As 75 vistorias históricas fora do expediente novo são concluídas/finalizadas e foram preservadas. Nenhuma escrita foi feita no Supabase. A suíte automatizada não foi executada.

## Cartões identificados e referências históricas ocultas — 31/10/2026


Os cartões mostram campos com rótulos explícitos para tipo de vistoria, situação, imóvel, código SAMI, prazo, vistoriador, agendamento e solicitante; cada tipo tem cor própria e o solicitante recebe destaque. As vistorias importadas mantêm o solicitante associado ao `created_by` do registro original. Protocolos locais `HIST-####` e códigos `HIST-<hash>` gerados para imóveis históricos sem vínculo continuam guardados no SQLite para rastreabilidade, mas ficam ocultos em cartões, agenda, detalhe, avisos e rascunho de WhatsApp. Os códigos SAMI reais não são alterados.
