# Gestão de manutenção imobiliária — inventário funcional comparado

Pesquisa pública em **19/10/2026**, referência de data America/Sao_Paulo. Projeto independente de SaaS imobiliário. Escopo: manutenção e chamados; vistorias são apenas uma possibilidade futura de integração.

## Resultado para a decisão de produto

O ponto de partida recomendado é um **painel operacional da imobiliária**: receber e identificar a demanda, fazer triagem, obter orçamento e autorização, emitir a ordem de serviço, acompanhar a execução e registrar a solução e o custo. O portal do inquilino deve entrar depois, aproveitando esse processo já organizado.

Entre as fontes examinadas, **Property Meld oferece a documentação mais detalhada da coordenação entre as partes**. DoorLoop ajuda a distinguir pedido, ordem e despesa. Refera e Triider acrescentam referências brasileiras de intermediação e prestação de serviços. Locarë documenta um fluxo integrado à locação. Solane permite observar a entrada pública. Venzya mostra a importância de separar um módulo anunciado de uma função efetivamente disponível. Essa leitura é uma interpretação do material pesquisado, não um ranking de qualidade, participação de mercado ou desempenho real.

O [backlog e a arquitetura proposta](02-backlog-e-arquitetura.md) convertem os achados em requisitos próprios, com prioridades, dependências e critérios de aceite.

## Método, evidência e limites

Foi aplicada a metodologia da skill **reverse-engineer-anything (REA)**: perguntas por etapa do processo, observação externa, inventário de evidências e separação de observação, declaração e inferência. A coleta usou leitura web e navegador em páginas públicas. **Não houve conexão CDP nem captura pelo motor REA; os códigos de fonte deste relatório não são Evidence IDs do REA.**

A conversa de origem foi consultada. As mensagens do usuário recuperadas confirmam o foco em manutenção e o portal futuro. As respostas antigas do assistente vieram apenas como referências de conteúdo, sem corpo textual utilizável; nenhuma conclusão comercial foi herdada delas.

| Código | O que significa | O que permite concluir |
|---|---|---|
| **O** | Interface pública observada no navegador | A tela, o campo ou a interação pública estavam acessíveis. Não comprova envio, persistência ou operação interna. |
| **D** | Manual ou tutorial operacional oficial | O fornecedor documenta o comportamento e suas etapas. Não é teste independente de execução. |
| **C** | Página comercial, FAQ ou descrição oficial do app | A capacidade é anunciada. A evidência é mais limitada que um tutorial operacional. |
| **N** | Não evidenciado no recorte pesquisado | Permanece desconhecido; não significa que o produto não tenha a função. |
| **P** | Proposta original para o novo SaaS | Decisão de projeto inspirada no problema e nas evidências; não é capacidade atribuída a concorrente. |

“Comprovado” aqui significa **comprovado no nível indicado**: uma tela pública pode ter sido observada; uma rotina interna pode estar apenas documentada. Nenhum dos sete produtos teve o ciclo autenticado executado de ponta a ponta.

Não foram criadas contas, enviados formulários, solicitados serviços, efetuados pagamentos ou acessados dados privados. Não houve busca por vulnerabilidades, extração de código, APIs privadas ou tentativa de contornar autenticação. Telas de tutoriais foram inspecionadas como documentação; imagens promocionais não foram tratadas como aplicação operada. Os fluxos e a modelagem propostos são originais: não reproduzir identidade visual, redação, imagens, layouts ou código dos fornecedores.

## Identidade e perfis

| Plataforma | Natureza e perfis sustentados pelas fontes | Limite importante |
|---|---|---|
| **Refera** | SaaS e operação assistida/terceirizada de manutenção; imobiliária, equipe Refera, inquilino, proprietário e prestador. C — R1–R5. | Separar o que o software faz do trabalho humano contratado. |
| **Solane** | Plataforma entre imobiliária/condomínio/administradora, solicitante e prestador. C — S1; entrada pública O — S2/S3. | Perfis, permissões e operação interna não testados. |
| **Locarë** | Gestão de locação com manutenção; equipe interna e portais de inquilino/proprietário. D — L1. | Não foi demonstrada conta própria de prestador. |
| **Venzya** | Platform de gestão imobiliária; equipe, papéis/filiais e portal do inquilino. C — V1–V3. | O Copilot comercial é um produto/contexto distinto do atendimento de manutenção. |
| **Triider** | Marketplace cliente–prestador e oferta pública específica para imobiliárias, envolvendo inquilino e proprietário. D/C — T1–T10. | A landing imobiliária está acessível; operação do pacote empresarial não foi testada. |
| **Property Meld** | Coordenação de manutenção: gerência, residente, proprietário, prestador, técnico interno e funções administrativas/financeiras. D — M1–M14. | Acesso sem senha por link continua sendo autenticação. |
| **DoorLoop** | Gestão imobiliária com equipe interna, inquilino/proprietário em portais e prestador que pode receber um usuário. D — D1–D14. | Um contato de prestador não equivale a usuário com permissão. |

## Matriz por etapa

Cada célula remete ao registro de fontes abaixo. Termos semelhantes não implicam a mesma profundidade, plano contratado ou implementação.

| Etapa | Refera | Solane | Locarë | Venzya | Triider | Property Meld | DoorLoop |
|---|---|---|---|---|---|---|---|
| **Abertura** | C app/portal/WhatsApp R1/R2 | O formulário público S2 | D equipe/portal L1 | C equipe/portal V1 | D categoria/local T1/T2; C imobiliária T8 | D equipe/MAX M1/M2 | D equipe/portal D1 |
| **Análise e triagem** | C análise assistida R1/R2 | C categoria/região S1 | D prioridade/filtros L1 | N regras detalhadas V1 | D distribuição regional T1; C equipe T8 | D prioridade/categoria/coordenação M1/M2 | D categoria/prazo/atribuição D1/D2 |
| **Orçamento** | C detalhado/PDF R2 | C proposta digital S1 | D valor/escopo L1 | N | D propostas e negociação T1/T2 | D vários prestadores/itens M4/M5/M14 | D itens na OS D4; N rodada de cotações |
| **Aprovação** | C proprietário/inquilino R1/R2 | C aprovar/negociar/recusar S1 | D portal/registro externo L1 | N | D cliente T2/T6; C proprietário T8 | D decisão no Owner Hub M6/M7 | D flag já aprovado D4; N decisão transacional |
| **Prestadores** | C homologação/região R3 | C rede própria/homologada S1 | D identificação/contato L1 | C fornecedor vinculado V1 | D marketplace/perfil T1/T7 | D aceite e atribuição M5/M8 | D cadastro/usuário separado D5–D7 |
| **Ordem de serviço** | C execução vinculada R1/R4 | C OS central S1 | N objeto separado | C imóvel+chamado+fornecedor V1 | N OS formal; D pedido/contratação T2 | D Meld como objeto operacional M1/M8 | D OS subtarefa do pedido D3/D4 |
| **Agenda e execução** | C visita ≠ execução R4 | C agenda/fotos S1 | D agenda/andamento L1 | C checklist/ocorrências V1 | D combinação em chat T2/T4 | D disponibilidade/agendamento/conclusão M2/M5/M9 | D prazo/acesso/conclusão D4; recorrência D9 |
| **Comunicação** | C WhatsApp/notificações R1/R5 | C chat/status S1; O consulta S3 | D públicos separados L1 | C limitações de envio V2 | D chat/notificações T2/T3 | D chat/e-mail/SMS M8 | D feed/e-mail/push D8/D14 |
| **Financeiro** | C parcelamento/repasse R2/R3 | C autorização/repasses S1 | D custo/pagador L1 | N financeiro por OS; limites V2 | D/C cobrança pós-serviço/repasse T5/T6 | D faturas; pagamento externo M8/M10/M11 | D itens/bill; integração D4/D5 |
| **Histórico** | C fotos/garantia/painel R1/R5 | C por imóvel/OS S1 | D cronologia/reabertura L1 | C histórico/auditoria V1 | D pedidos/conversas T2/T3; C painel T8 | D Activity M1 | D pedido/OS/feed D3/D8 |
| **Relatórios** | C imagens anunciadas R5 | C genéricos S1 | D manutenção/exportação L1 | C gerais; manutenção N V2/V3 | C indicadores empresariais T8 | D catálogo/exportação M12 | D relatórios por objeto D10/D11 |

## Inventário de evidências — Brasil

### Refera

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **R1 — [Imobiliárias](https://www.refera.com.br/imobiliarias)** | C: modelos SaaS e terceirizado; abertura multicanal; análise da demanda; seleção de profissional; acompanhamento com etapa, responsável e prazo. Aprovação online/WhatsApp; execução documentada e garantia. Não comprova permissões, conciliação ou cumprimento de prazos. |
| **R2 — [Clientes de imobiliárias](https://www.refera.com.br/cliente-imobiliaria)** | C: fluxo demanda → avaliação → orçamento → aprovação por proprietário ou inquilino → execução. PDF com fotos, materiais e valores; parcelamento e atualizações por WhatsApp. Não revela campos nem comprova portal sem login. |
| **R3 — [Prestadores](https://www.refera.com.br/prestadores)** | C: cadastro/homologação, especialidades, distribuição regional, avaliações, registros no app e repasse anunciado após conclusão. Não foram verificados cálculo de ranking, liquidação ou tratamento de disputas. |
| **R4 — [App oficial de prestadores](https://play.google.com/store/apps/details?hl=pt&id=com.kaasa.refera.prestadores)** | C, descrição do desenvolvedor: acompanhar chamado, marcar visita, marcar execução, finalizar com fotos e enviar nota fiscal. Sustenta distinguir diagnóstico/visita de execução, sem teste do aplicativo. |
| **R5 — [Página principal](https://www.refera.com.br/)** | C: funil, notificações, documentação e APIs REST para ERP anunciadas. Imagens/descrições comerciais apresentam relatórios e pagamentos. Não foi examinada documentação de API nem operados relatórios; catálogo, filtros e indicadores específicos permanecem incertos. |

### Solane

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **S1 — [Página principal e FAQ](https://www.solane.com.br/)** | C: OS, categorização/distribuição regional, orçamento negociável, rede homologada ou própria, chat, agenda, fotos anteriores/posteriores, histórico, relatórios, notificações e integração anunciada de imóveis/contratos. Aprovação de pagamento e repasses são alegações, não liquidação observada. O painel da landing é demonstração promocional. |
| **S2 — [Reportar um problema](https://www.solane.com.br/solicitar.html)** | O: formulário acessível sem sessão. Campos: nome, telefone/WhatsApp, administradora responsável, CEP, endereço, estado, cidade, descrição, fotos, nome e CPF/CNPJ do proprietário. Administradora, CEP e fotos aparecem sem marca de obrigatoriedade; não foi observado seletor de categoria nem e-mail. Nada foi preenchido/submetido. A obrigatoriedade efetiva no servidor e a criação do chamado não foram testadas. |
| **S3 — [Acompanhar solicitação](https://www.solane.com.br/acompanhar.html)** | O: pede código do chamado e telefone informado. Não foi feita consulta. A existência dos campos não comprova segurança da busca nem quais informações seriam retornadas. |

### Locarë

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **L1 — [Manual público, seção Manutenção](https://www.locareapp.com/manual#chamados)** | D: chamado por equipe ou inquilino, associado ao contrato; assunto, urgência e foto; aviso de chamados existentes; filtros e indicadores. Guarda prestador, agenda, orçamento, solução, custo, pagador e cronologia. Proprietário decide no portal; equipe pode registrar resposta externa com autoria. Separa notas internas; inquilino confirma solução ou reabre. Documenta recorrência, calendário, exportações e indicadores de custos/prazos/imóveis/prestadores. Custo pode alimentar cobrança ou despesa conforme o caso. Portais e permissões são descritos no mesmo manual. N: comparação de cotações, marketplace, conta de prestador e OS separada. |

O manual foi aberto no navegador, mas seu conteúdo é documentação do produto; não foi operada a aplicação autenticada. As alegações jurídicas do manual não foram adotadas como regras do novo SaaS.

### Venzya

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **V1 — [Módulo operacional](https://venzya.com.br/modulos/operacional)** | C: abertura/andamento/histórico e portal de chamados; OS ligada a imóvel, chamado e fornecedor; checklists, ocorrências, feedback e auditoria. N: campos, SLA, orçamento/aprovação, agenda e financeiro por OS. Fotos descritas para vistoria não comprovam anexo fotográfico do chamado. |
| **V2 — [Transparência do produto](https://venzya.com.br/transparencia)** | O da página; C das capacidades. Revisão declarada pelo fornecedor em 10/10/2026. Afirma operacional, papéis e dashboards disponíveis, mas ressalva: relatórios financeiros em arquivo incompletos; notificações dependem de ativação; mensageria genérica de marketing é simulada; WhatsApp oficial é outro fluxo; não existe app nativo. Isso não é auditoria nossa do código nem prova de relatórios de manutenção. |
| **V3 — [Página principal](https://venzya.com.br/)** | C: módulos compartilhados, papéis, isolamento por imobiliária e demonstrações com dados fictícios. Não foram testados isolamento nem permissões. Não transferir funcionalidades comerciais do Copilot para chamados da Platform. |

### Triider

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **T1 — [Como faço um pedido de serviço](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985310917523-Como-fa%C3%A7o-um-pedido-de-servi%C3%A7o)** | D: categoria, localização e perguntas; distribuição por região; propostas conforme disponibilidade, consulta de perfis e chat. Documenta até três orçamentos em 24 horas, condicionado ao caso. Não adotar como SLA do nosso produto. |
| **T2 — [Pedir orçamentos e contratar](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985364280851-Passo-a-passo-como-pedir-or%C3%A7amentos-e-contratar)** | D: perguntas, texto livre, preferências provisórias de data/horário, negociação e contratação; prestador informa execução e solicita autorização de pagamento; avaliação final. Há diferença de redação sobre quantidade de propostas em relação a T1; não prometer quantidade garantida. |
| **T3 — [Consultar orçamentos](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985343580691-Como-vejo-meus-or%C3%A7amentos)** | D: alertas por push/e-mail, abas de propostas/mensagens e consulta aos pedidos. Histórico do pedido não comprova dossiê ou relatório por imóvel. |
| **T4 — [Após o aceite do orçamento](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985331211027-Um-cliente-aceitou-meu-or%C3%A7amento-no-Servi%C3%A7o-P%C3%B3s-Pago-O-que-devo-fazer)** | D: confirmação de escopo, valor, data e horário no chat. Não comprova agenda sincronizada, check-in ou OS formal. |
| **T5 — [Recebimento do prestador](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985371220371-Como-recebo-pelos-servi%C3%A7os-P%C3%B3s-Pagos-prestados)** | D: plataforma recebe após o serviço e repassa ao prestador em calendário semanal, descontando taxa. É regra documental, sem transação observada. |
| **T6 — [Pagamento](https://www.triider.com.br/pagamento)** | C/D público: contratação com cartão validado, cobrança após execução, autorização pelo cliente e parcelamento. Separar contratação, aceite da execução e pagamento. |
| **T7 — [Termos e condições](https://www.triider.com.br/termos-e-condicoes)** | D institucional: intermediação cliente–prestador, negociação, imagens, revisões de escopo, avaliações e cobrança. Não comprova contabilidade imobiliária ou responsabilidade contratual de cada locação. |
| **T8 — [Triider para imobiliárias](https://www.triider.com.br/imobiliarias)** | O: página e abas/expansões públicas acessíveis no navegador. C: entrada por área logada da imobiliária integrada ou app/site; condução humana; aprovação do proprietário; painel com abertos, realizados no mês, pendências financeiras e valor por período. A leitura web inicial retornou vazio/cache antigo, mas o navegador exibiu o conteúdo. Não classificar a oferta apenas como histórica; a operação e contratação atuais continuam não verificadas. |
| **T9 — [Cancelamento](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985380405395-Posso-cancelar-uma-contrata%C3%A7%C3%A3o)** | D: cancelamento, comunicação no chat e intervenção do suporte. Não equivale a política própria de cancelamento de um chamado imobiliário. |
| **T10 — [Expiração](https://triidermadeira.zendesk.com/hc/pt-br/articles/37985328595091-O-que-%C3%A9-o-prazo-de-expira%C3%A7%C3%A3o)** | D: propostas/pedidos podem expirar sem contratação, com aviso e intervenção do suporte. Inspira lembretes; não justifica encerrar automaticamente manutenção pendente no novo SaaS. |

N no recorte Triider: OS formal independente, reabertura operacional, recorrência preventiva e relatório analítico por imóvel. A aprovação do proprietário e os indicadores empresariais têm evidência comercial T8; não foram demonstrados pelos tutoriais do marketplace.

## Inventário de evidências — Property Meld

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **M1 — [Criar e gerenciar Melds](https://help.propertymeld.com/hc/en-us/articles/45827528593939-How-to-Create-Manage-and-Cancel-Meld-Requests)** | D: unidade/imóvel, título, prioridade, cômodo/categoria, acesso/presença, responsável, prazo, tags e recorrência. Estados distinguem atribuição, aceite, agenda, conclusão, impossibilidade/cancelamento; Activity registra eventos e autoria. |
| **M2 — [Solicitação pelo residente/MAX](https://help.propertymeld.com/hc/en-us/articles/45585845002131-How-to-Submit-and-Schedule-a-Maintenance-Request-Using-MAX)** | D: descrição guiada, perguntas condicionais, orientação inicial, fotos/vídeos, acesso, animais e janelas de disponibilidade. Não foram testadas a triagem ou as sugestões do assistente. |
| **M3 — [Entrada sem senha](https://help.propertymeld.com/hc/en-us/articles/46841528458387-MAX-Resident-Password-less-Login)** | D: link enviado ao e-mail associado ao residente abre sessão e possui expiração. Não equivale à abertura anônima sem conta solicitada para o novo SaaS. |
| **M4 — [Solicitar orçamento](https://help.propertymeld.com/hc/en-us/articles/45837670608275-How-to-Request-an-Estimate-Manager)** | D: um ou vários prestadores, prazo, notas e compartilhamento de arquivos; comentários internos separados. |
| **M5 — [Prestador responde orçamento](https://help.propertymeld.com/hc/en-us/articles/55284498532627-How-to-Respond-to-and-Submit-an-Estimate-Request-Vendors)** | D: aceitar/recusar cotação, agendar avaliação e enviar itens/valores. Aceitar orçar é separado da atribuição do serviço a executar. |
| **M6 — [Solicitar aprovação do proprietário](https://help.propertymeld.com/hc/en-us/articles/45837690664851-How-to-Request-Owner-Approval-Manager)** | D, com imagens públicas inspecionadas no navegador: gerente prepara solicitação e controla apresentação de itens, imagens e markup; visualiza mensagem antes de confirmar. A imagem do tutorial não é execução nossa da aplicação. |
| **M7 — [Decisão no Owner Hub](https://help.propertymeld.com/hc/en-us/articles/45793160480275-Approving-or-Rejecting-Estimate-Requests-in-Owner-Hub-Owner)** | D: proprietário consulta orçamento, conversa com gerência e aprova ou recusa. É evidência de fluxo decisório documentado, mais específica que uma flag administrativa. |
| **M8 — [Limites do prestador](https://help.propertymeld.com/hc/en-us/articles/45762751977619-What-You-Can-Cannot-Do-in-Property-Meld-Vendor)** | D: agenda, arquivos, comunicação com gerência/residente por chat com e-mail/SMS e trabalho em equipe. O artigo explicita que a plataforma não coordena pagamento entre prestador e imobiliária. |
| **M9 — [Concluir serviço](https://help.propertymeld.com/hc/en-us/articles/45762028488467-How-to-Finish-or-Complete-Meld-Vendor)** | D: data e notas de conclusão; o tutorial limita edição posterior e visibilidade ao residente. Não presumir que toda anotação operacional deva virar mensagem externa. |
| **M10 — [Criar e gerenciar faturas](https://help.propertymeld.com/hc/en-us/articles/45762431527699-How-to-Create-and-Manage-Invoices-Vendor)** | D: fatura pós-conclusão, itens, quantidades/preços, arquivos, rascunho, envio/correção e importação QuickBooks. Não comprova emissão fiscal brasileira. |
| **M11 — [Estados da fatura](https://help.propertymeld.com/hc/en-us/articles/45762442874259-Invoice-Statuses)** | D: rascunho, submissão, retenção/análise, aprovação, recusa e pago. O estado pago não é evidência independente de liquidação bancária. |
| **M12 — [Relatórios e exportação](https://help.propertymeld.com/hc/en-us/articles/45926643088787-Using-Reports-to-Generate-and-Export-Data)** | D: chamados, datas, avaliações, despesas, faturas/itens, horas e registros de entrada/saída; filtros, colunas e exportação; documentos financeiros em lote. Não houve geração de arquivo nesta pesquisa. |
| **M13 — [Workflows](https://help.propertymeld.com/hc/en-us/articles/46007189810835-Getting-Started-with-Workflows)** | D: gatilhos, condições, ações, atrasos e mensagens por modelos; ativação e permissões. Automatizar só depois de estados e eventos estruturados é proposta nossa. |
| **M14 — [Criar orçamento pelo gerente](https://help.propertymeld.com/hc/en-us/articles/45837673329043-How-to-Create-an-Estimate-Manager)** | D: gerente pode registrar proposta em nome de prestador/técnico, com itens, anexos e markup; autoria fica registrada. Não confundir lançamento pela equipe com submissão pelo fornecedor. |

## Inventário de evidências — DoorLoop

| ID / fonte oficial | Evidência funcional e alcance |
|---|---|
| **D1 — [Criar pedido do inquilino](https://support.doorloop.com/en/articles/7191970-create-a-tenant-request-maintenance-request)** | D: registro pela equipe ou portal habilitado; categoria, título, descrição, anexos, acesso, prioridade, prazo e responsáveis. O inquilino não controla atribuição, prioridade, prazo e situação internos. |
| **D2 — [Visão de tarefas e pedidos](https://support.doorloop.com/en/articles/17065217-view-tasks-work-orders-and-requests)** | D: listas por tipo, responsável e conclusão; busca, filtros, contadores, colunas e visões salvas. |
| **D3 — [OS como subtarefa do pedido](https://support.doorloop.com/en/articles/10642782-create-a-work-order-from-a-tenant-request-as-a-subtask)** | D: OS vinculada preserva a demanda original. Notas e arquivos não são copiados automaticamente. É necessário decidir explicitamente o que compartilhar. |
| **D4 — [Criar OS](https://support.doorloop.com/en/articles/6322778-create-a-work-order)** | D: prestador, prazo, acesso, anexos, situação, prioridade, responsáveis, peças/mão de obra e geração de bill. “Approved By Owner” registra aprovação já ocorrida; não comprova solicitação/decisão digital do proprietário. Tutorial restringe disponibilidade por plano. |
| **D5 — [Cadastrar prestador](https://support.doorloop.com/en/articles/6295184-add-a-vendor)** | D: contato, serviços, seguro, propriedades e relacionamento com despesas; pagamentos eletrônicos via integração anunciada. Não houve pagamento nem verificação de disponibilidade regional. |
| **D6 — [Atribuir ou notificar prestador](https://support.doorloop.com/en/articles/8887722-assign-or-notify-a-vendor-on-a-work-order)** | D: notificação por e-mail não dá permissão de editar OS. |
| **D7 — [Prestador como usuário](https://support.doorloop.com/en/articles/15452467-set-up-a-vendor-as-a-user-on-your-doorloop-account)** | D: usuário, convite e papel/permissões necessários para atuar internamente. Não comprova portal de prestador independente. |
| **D8 — [Pedidos no portal do proprietário](https://support.doorloop.com/en/articles/8390542-how-to-make-requests-through-the-owner-portal)** | D: abertura, comentários, Activity Feed e consulta a solicitações concluídas. |
| **D9 — [OS recorrente](https://support.doorloop.com/en/articles/11366177-create-a-recurring-work-order)** | D: periodicidade e geração automática. O registro futuro não aparece como OS/calendário antes da geração; distinguir programação de trabalho já criado. |
| **D10 — [Relatórios/equipe de manutenção](https://support.doorloop.com/en/articles/9791073-tasks-and-work-orders-not-appearing-for-maintenance-team)** | D: relatórios de tarefas, OS e pedidos condicionados ao acesso. N: KPIs específicos de SLA, tempo de resolução ou ranking de prestadores. |
| **D11 — [Papéis e permissões](https://support.doorloop.com/en/articles/6380630-limit-access-to-your-users-by-editing-user-roles)** | D: escopo de tarefas próprias/todas, ações e relatórios por papel. Proteções não foram testadas. |
| **D12 — [Assistente no portal](https://support.doorloop.com/en/articles/12091904-doorloop-ai-assistant-ai-enhanced-tenant-portal-support)** | D: coleta guiada de problema, fotos, acesso e urgência; indicadores de conversas/solicitações/resoluções. Depende da oferta/plano. Não confirma eficácia ou economia anunciada. |
| **D13 — [Vistoria e próximos passos](https://support.doorloop.com/en/articles/13134260-review-a-completed-inspection-and-next-steps)** | D: inspeção pode originar OS geral ou por item, com vínculo. Usado somente como referência de integração futura; não é escopo de implementação atual. |
| **D14 — [Notificação de pedidos recebidos](https://support.doorloop.com/en/articles/7143051-enable-email-and-push-notifications-for-tenant-requests-maintenance-requests-received)** | D: e-mail/push para esse evento, sem SMS nele. Não generalizar essa limitação para todos os canais da plataforma. |

## O que incorporar e o que continua em aberto

As seguintes conclusões são **P — propostas para o novo SaaS**:

1. **Separar demanda de trabalho contratado.** Um problema pode exigir visita de diagnóstico, troca de prestador e mais de uma OS. Orçamentos, aprovações e custo final precisam preservar esse vínculo.
2. **Separar três decisões.** Autorizar executar, confirmar que resolveu e aprovar/pagar a despesa são eventos diferentes, com autores e evidências próprios.
3. **Começar com prestadores da imobiliária.** Marketplace, homologação em escala e intermediação financeira ampliam muito a operação; não são necessários para organizar o painel.
4. **Construir histórico que continue após mudar o inquilino.** O imóvel/unidade é durável; a locação é um vínculo com período. Não vincular tudo apenas ao nome do solicitante atual.
5. **Preservar públicos diferentes.** Anotação da equipe, orientação ao prestador, informação ao inquilino e aprovação do proprietário precisam de visibilidade explícita.
6. **Portal sem login é entrada pública.** Nome e endereço são declarações, não autenticação nem autorização para consultar contratos. O cadastro deve chegar à triagem; acompanhamento privado pode usar um mecanismo próprio depois.
7. **Só chamar integração de pronta quando a entrega for verificável.** Distinguir mensagem preparada, envio aceito, entrega e leitura; valor previsto, aprovado, lançado e pago.

| Tema ainda sem resposta independente | Próxima verificação discriminante, fora desta pesquisa |
|---|---|
| Persistência e transições internas | Demonstração guiada em ambiente de teste autorizado, usando imóveis e pessoas fictícios. |
| Permissões e isolamento de organizações | Teste autorizado com dois clientes de teste e papéis diferentes. |
| Disponibilidade por plano/região | Confirmação comercial do fornecedor; não deduzir de botão ou landing. |
| Segurança dos portais públicos | Avaliação própria e autorizada; nada foi testado contra terceiros. |
| Pagamentos e integrações | Sandbox autorizado, reconciliação e evidência de resultado. |
| Telas móveis e acessibilidade completas | Teste específico com tarefas e dispositivos definidos. |

**Cobertura do pedido:** as sete plataformas e todas as etapas solicitadas foram mapeadas. Há lacunas públicas explicitadas em N; isso limita a comparação, sem converter ausência de evidência em inexistência. Não foi necessário ultrapassar nenhuma barreira de autenticação.
