# Decisões e pendências — Gestor Imob

## Confirmado pelo usuário

| Data | Decisão | Fonte |
|---|---|---|
| 19/10/2026 | Pasta oficial: `E:\Novos projetos\Gestor_imob`. | Instrução direta nesta conversa. |
| 19/10/2026 | Foco atual em manutenção/chamados; painel interno primeiro. | Pedido de pesquisa e especificação. |
| 19/10/2026 | Portal futuro sem login: titular, endereço completo, contato, tipo, descrição e fotos. | Pedido de pesquisa e especificação. |
| 19/10/2026 | Preparar integração futura com vistorias; não desenvolver vistorias agora. | Pedido de pesquisa e especificação. |
| 31/10/2026 | Prioridade atual: vistorias, pedidos e agendamentos no fluxo do sistema antigo; manutenção passa para etapa posterior. | Instrução direta do usuário; substitui as prioridades de 19/10. |
| 31/10/2026 | Adicionar pedidos internos de confecção de contrato: ocupação, aditivo ou motivo manual; imóvel compartilhado com vistorias; data de solicitação automática, prazo, justificativa de atraso e envio à gestora registrado pelo sistema. | Instrução direta do usuário. Gestão abre; Gestão/Atendimento acompanham. O escopo controla o pedido, sem gerar documento jurídico ou assinatura. |
| 02/11/2026 | Auto-vínculo de contrato e vistoria de ocupação: ao criar vistoria de ocupação para um imóvel, o sistema detecta solicitações ativas de contrato de ocupação geradas pelo mesmo solicitante (ou no mesmo imóvel), pré-preenche o prazo com a data prevista de entrega e assinatura, vincula o contrato à vistoria e expõe navegação cruzada direta entre os detalhes. | Instrução direta do usuário. |
| 03/11/2026 | Histórico completo do imóvel com vistorias, manutenções e contratos: corrigida a exibição do histórico de imóveis (#properties), substituindo o redirecionamento vazio de tickets por modal dedicado (openProperty), unificando todas as vistorias, chamados e contratos em ordem cronológica com abas por tipo, badges reais de contagem em cada card, barra de busca instantânea e atalhos rápidos com o imóvel pré-selecionado. | Solicitação direta do usuário. |
| 03/11/2026 | Botão e permissão de solicitação de contrato para toda a equipe: ajustada a permissão para canUseContracts() (admin e staff) em app.js e service.js, garantindo que o botão "+ Solicitar contrato" apareça na barra superior, no cabeçalho do painel de contratos e no aviso de estado vazio, permitindo que a equipe abra pedidos de confecção de contrato livremente. | Instrução direta do usuário. |
| 03/11/2026 | Integração e persistência direta no Supabase: implementada sincronização contínua de usuários e imóveis com o banco Supabase em server/supabase.js (tabelas people e properties); resolvida a persistência da usuária Alice Terezinha Luz no Supabase; adicionada conciliação bidirecional na inicialização e suporte em api/_handler.js para Vercel. | Instrução direta do usuário. |
| 02/11/2026 | Gestão de prestadores na administração: adicionada gestão completa de prestadores (cadastro, edição com situação Ativo/Inativo e exclusão definitiva com proteção de integridade referencial de OS); posicionada navegação de Prestadores sob a área ADMINISTRAÇÃO para administradores. | Solicitação direta do usuário. |
| 02/11/2026 | Exclusão de chamados e modal de confirmação customizado: adicionada exclusão definitiva de solicitações de manutenção (DELETE /api/tickets/:id) com remoção em cascata; e substituído o confirm() nativo do navegador por um modal in-app estilizado (<dialog id="confirm-modal">) eliminando avisos do navegador ou menções externas. | Solicitação direta do usuário. |
| 02/11/2026 | Requisito de senha reduzido para no mínimo 4 caracteres: ajustada a validação no backend (service.js) e no frontend (app.js minlength e placeholder) para aceitar senhas a partir de 4 caracteres. | Solicitação direta do usuário. |
| 02/11/2026 | Controle de cache e eliminação de menções de versão local: adicionado cache-busting nos assets estáticos (?v=20261102b), cabeçalhos estritos de no-cache no servidor HTTP e remoção de termos de versão local e servidor local em mensagens da interface. | Solicitação direta do usuário. |
| 02/11/2026 | Limpeza de avisos locais, remoção do nome da imobiliária e inclusão de créditos: removidas as menções de ambiente local, cópia local e base local; retirado o card de imobiliária (.workspace) da barra lateral; e adicionado nos rodapés (login e painel) o crédito: 'Sistema desenvolvido e criado por Léo Antunes'. | Solicitação direta do usuário. |
| 02/11/2026 | Duração definida pelo vistoriador e registro de data/hora do sistema: removido campo de duração do formulário de solicitação da gestora; a duração é herdada em segundo plano da última vistoria do imóvel/tipo para cálculo de agenda proposta e confirmada/ajustada pelo vistoriador no acompanhamento. Exibida a data e hora do registro no sistema (created_at) e tornado o prazo de entrega editável manualmente a qualquer momento. | Instrução direta do usuário. |
| 02/11/2026 | Rolagem vertical e ajuste de densidade na barra lateral (.sidebar): habilitado overflow-y: auto com scrollbar discreta, flex-shrink: 0 nos blocos de menu e espacamentos ajustados para que a seção ADMINISTRAÇÃO / Equipe e perfil fiquem sempre acessíveis mesmo em telas de menor altura. | Solicitação do usuário. |
| 02/11/2026 | Correção visual dos botões de acompanhamento: ajustado o layout da área de perigo (.inspection-danger-zone) e da caixa lateral (.triage-box) com white-space: normal, flex-direction: column e título mais conciso ('Limpar acompanhamento') para eliminar o transbordamento horizontal dos botões para fora do container. | Observação do usuário com print da interface. |
| 02/11/2026 | Limpeza de acompanhamento e exclusão de vistoria: adicionada a opção 'Limpar acompanhamento' (reseta status para Nova, remove vistoriador, agendamento, notas e motivo, deixando a vistoria disponível para preenchimento novamente) e 'Excluir vistoria' permanente via `DELETE /api/inspections/:id`. Transições de status tornadas flexíveis para correções operacionais. | Instrução direta do usuário. |

## Banco compartilhado — 19/10/2026

Confirmação do usuário: preservar o outro sistema que usa o Supabase; `people` contém apenas equipe/vistoriadores; `properties.code` é o código de registro do imóvel na imobiliária. O endereço de vistorias foi observado em consulta, sem edição; a tela não comprova regras de segurança ou identidade de acesso.

Proposta técnica pendente de validação: schema `gestor_manutencao` separado e fechado; tabelas iniciais próprias; referências lógicas para imóveis/equipe/vistorias, sem FK para tabelas existentes. Motivo: até uma FK aditiva pode impedir uma exclusão realizada pelo sistema antigo. Manter cópia do código/endereço no chamado; conferir associação no servidor.

Rascunho e limites: `supabase/PLANO-MANUTENCAO.md`. Não aplicado ao banco, sem nova exposição Data API ou permissões de runtime. Rever após auditoria de políticas/event triggers, backup restaurado em teste e regressão do sistema de vistorias. Novo banco/projeto é alternativa se for necessário isolamento de recursos.

## Propostas do planejamento

- Arquitetura modular única, banco relacional, arquivos privados e fila para tarefas externas.
- Separação de chamado, proposta versionada, autorização, OS e obrigação financeira.
- Prestadores próprios da imobiliária e financeiro gerencial na primeira versão.
- Implementação guiada pelos itens P0 e respectivos critérios de aceite do backlog.

São recomendações, sujeitas a detalhamento e decisões de implementação. A definição da pasta não equivale a aprovação automática de toda proposta comercial ou técnica.

## Escolha técnica da primeira versão local — 19/10/2026

Node.js 24 e SQLite nativo, sem dependências de terceiros; interface própria em HTML/CSS/JavaScript. Justificativa: começar localmente com o runtime já instalado e persistência real, reduzindo instalação e serviços externos. Acesso restrito a loopback; esta configuração de demonstração não deve ser publicada. A API SQLite usada foi conferida no runtime instalado; o módulo ainda tem histórico de evolução e requer reavaliação antes de produção.

Implementação modular em `server/database.js`, `server/service.js`, `server/http.js` e `public/`. Custos usam centavos inteiros. Credenciais fictícias de demonstração são explícitas; senha é derivada com scrypt, sessões usam token aleatório armazenado como hash e cookie HttpOnly/SameSite. Regras de organização, papel, revisão de orçamento e autorização são verificadas no servidor.

Não houve escolha de provedor de nuvem, domínio ou cobrança. A base local pode evoluir ou ser migrada quando o piloto definir os requisitos. O recorte e as pendências estão em `ESTADO-IMPLEMENTACAO.md`.

## Em aberto antes de detalhar a primeira versão

- Tecnologia de hospedagem e eventual evolução da base local.
- Volume inicial de imóveis, chamados e operadores.
- Papéis, alçadas, pagadores e necessidade de aprovação por proprietário.
- Canal de comunicação prioritário e integrações existentes.
- Hospedagem, identidade visual e modelo de cobrança do SaaS.

## Registro da inicialização

Documentos originais copiados sem alterações de conteúdo para `docs/`. Contexto e instruções locais criados. Nenhuma aplicação foi instalada ou publicada nesta inicialização. A procedência dos documentos está em `PROVENIENCIA.json`.


## Execução da base privada — 19/10/2026

Criadas quatro tabelas em gestor_manutencao no Supabase novabase, versão 20261020022640, após exportação autorizada das oito tabelas do aplicativo e recuperação verificada em PostgreSQL 17.11 local. Dados recuperados coincidiram integralmente em três comparações; migração e fluxo SQL de vistorias testados na cópia com transação fictícia revertida. Essa cópia não equivale a backup completo do projeto gerenciado.

Nenhuma diferença encontrada nos objetos antigos conferidos. Novas tabelas vazias/fechadas, sem FK externa e sem acesso dos papéis da API. Não foi alterada a política do sistema antigo nem redefinida senha. Runtime do painel permanece local/fictício até implementar identidade real e autorização por imobiliária. Ver supabase/EXECUCAO-MANUTENCAO.md.

## Prioridade de produto atual — 31/10/2026

O usuário priorizou pedidos de vistoria, atribuição de vistoriador, agendamento, acompanhamento por status e histórico, tomando como referência funcional o sistema antigo informado. Também pediu o fluxo interno de solicitação de confecção de contratos, reaproveitando o cadastro de imóveis. O protótipo local continua SQLite. Não conectar nem alterar o Supabase compartilhado até definir identidade/autorização para a equipe. O fluxo de contratos não gera documento jurídico nem assinatura. Checklist, laudo e evidências ainda precisam ser detalhados. Pedidos de manutenção continuam em etapa posterior.

## Agenda de vistorias, aceite e avisos — 31/10/2026

Aplicar a todos os vistoriadores o expediente informado: 08:00–18:00, com pausa 11:00–13:00. Não há regra de dias da semana definida; a busca de sugestões considera os próximos 14 dias corridos. Atribuição exige cargo local Vistoriador. O horário proposto bloqueia sobreposições enquanto aguarda aceite; só o vistoriador designado aceita. Mudança de horário aceito pela Gestão volta a aguardar confirmação. Atraso é calculado somente pelo prazo informado no pedido.

O SQLite local conserva duração/fim para calcular conflitos e sugerir duração por imóvel/tipo; sem amostra do imóvel, usa a mediana histórica do tipo. A agenda prioriza itens ativos e os encerrados permanecem na lista/Kanban mediante filtro. Ao concluir, mantém aviso interno à pessoa solicitante e disponibiliza um link que prepara uma mensagem WhatsApp para revisão humana; não importa telefone, não dispara nem envia automaticamente. Tudo permanece isolado do Supabase compartilhado.

Evidência: retrato local autorizado de `inspections` e `work_schedules` e catálogo PostgreSQL arquivado em `docs/supabase/baseline-catalogo-public.json`; edição local em `server/database.js`, `server/service.js`, `server/http.js` e `public/`. O retrato local continha 653 durações correspondentes e 29 horários sem duração exata; os 29 receberam fallback de mediana concluída/finalizada por tipo. Limitação: 75 registros históricos concluídos/finalizados tinham horários fora do expediente novo e foram preservados sem reescrita. Não equivale a verificar os fluxos autenticados do sistema antigo nem altera dados remotos.
