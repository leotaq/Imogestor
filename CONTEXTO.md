# Contexto curto — Gestor Imob

Atualizado em 31/10/2026, America/Sao_Paulo. Vistorias seguem como operação principal; o usuário também pediu o fluxo interno de solicitação e confecção de contratos. Manutenção fica para depois.

## Fonte e objetivo

- Pasta oficial: E:\Novos projetos\Gestor_imob, definida pelo usuário.
- Manter o módulo interno de vistorias e adicionar o fluxo de solicitação de confecção de contratos, ligado ao mesmo cadastro de imóveis.
- Sistema antigo enviado pelo usuário: https://visto-new.vercel.app/vistorias. Referência observada em modo de consulta; não selecionar identidades nem alterar registros reais.
- Manutenção/chamados continuam no protótipo local e serão a etapa seguinte. O portal futuro sem login é específico para pedidos de manutenção.
- Não existe conexão ativa ao Supabase. A cópia SQLite local, autorizada em 31/10/2026, contém 417 imóveis, nove pessoas ativas e 859 vistorias com 3.154 eventos; cinco usuários inativos existem apenas para preservar referências históricas e não podem entrar. A conexão de produção ainda depende de identidade e autorização seguras.
- Pesquisa em docs/01-inventario-comparativo.md; backlog/arquitetura em docs/02-backlog-e-arquitetura.md; decisões em docs/DECISOES.md.
- Projeto independente de Cabal/Phoenix.

## Aplicação local

Versão local: Node.js 24, SQLite nativo, interface própria HTML/CSS/JavaScript. Iniciar por Iniciar_Gestor_Imob.cmd ou npm.cmd start; acesso somente em http://127.0.0.1:4173. Vistorias locais: pedido, protocolo, imóvel com snapshot do código SAMI/endereço, tipo, solicitante da equipe, vistoriador, prazo, agendamento, Kanban inicial com Nova em destaque, lista opcional, agenda mensal, temas claro/escuro, status e histórico. Canceladas, concluídas e finalizadas ficam ocultas por padrão até seleção do filtro. Ao passar para Concluída, uma notificação interna vai para a pessoa solicitante ativa; a área Avisos mostra os não lidos e atualiza a cada 30 segundos. Abrir o aviso leva à vistoria e marca como lido; finalizar pelo solicitante também marca como lido. Não há envio externo nem avisos retroativos para conclusões importadas. No pedido, admin/atendimento podem cadastrar imóvel sem perder o rascunho; o código informado é mantido como texto e usado no snapshot. A solicitação de contrato reutiliza o cadastro de imóveis e registra tipo, solicitante, data automática, prazo, dados adicionais, justificativa de atraso e envio à gestora; alertas de vencimento aparecem no painel e avisos de envio ficam na área Avisos. Somente Gestão cria a solicitação; Gestão/Atendimento acompanham a confecção. O sistema não gera o documento contratual, não coleta assinatura nem envia fora do painel. O protótipo de manutenção existente fica secundário. Não supor prontidão para produção; ver docs/ESTADO-IMPLEMENTACAO.md.
Painel de equipe local: somente Gestão administra contas; os perfis disponíveis são Gestão, Atendimento e Financeiro. Inativar bloqueia o login, revoga sessões e preserva o histórico. O painel não envia convites e não usa autenticação Supabase. O cadastro também permite marcar o cargo/nomenclatura Gestora, Gerente, Atendente, Assistente ou Vistoriador, sem alterar o perfil de acesso; as contas atuais ficam como A definir até escolha da Gestão. Em 31/10/2026, leonardo foi promovido a Gestão na base local; as três contas de demonstração dessa organização foram desativadas após backup verificado. A senha de Leonardo não foi alterada.

O formulário de imóvel segue os campos confirmados em `public.properties`: rua, número, complemento, bairro e cidade, mantendo o código SAMI. A cópia SQLite recebeu apenas colunas locais aditivas em 31/10/2026; os registros anteriores não foram alterados nem preenchidos por inferência. Não houve escrita no Supabase.

O runtime continua SQLite, sem integração ou sincronização com Supabase. Por autorização do usuário em 31/10/2026, a cópia local ignorada `data/gestor.sqlite` recebeu 417 imóveis de `public.properties` (ID/código/endereço), nove pessoas ativas e 859 vistorias com 3.154 eventos; o snapshot privado e as contagens verificadas estão descritos em `docs/ESTADO-IMPLEMENTACAO.md`. Imóveis ficam sob organização fictícia local `aurora`, junto aos seis imóveis de demonstração; usuários inativos ligados ao histórico estão bloqueados para login. Backup anterior às cargas de imóvel e vistoria passou em `PRAGMA integrity_check`; a integridade após cada carga também foi conferida. Tratar esta base como privada; não publicar nem conectar contas locais ao Supabase. Checklist, laudo, fotos/mapa e portal externo de vistorias ainda não estão implementados. Para manutenção futura, preservar chamado, orçamento/versão, autorização, OS, confirmação da solução e obrigação financeira; visita diagnóstica tem autorização própria.

## Supabase existente e sistema de vistorias

Projeto novabase, referência pfakuvnuyixebvtmwmgu, PostgreSQL 17.6. Usuário confirmou que properties.code é o código do imóvel no sistema da imobiliária e que properties guarda seu endereço. Chave técnica: properties.id UUID; UNIQUE(code_normalized) comprovada, sem tratar código/endereço como autenticação. people contém somente equipe/vistoriadores; relação com Auth ainda não definida.

O outro sistema usa esse banco e precisa ser preservado. Endereço enviado: https://visto-new.vercel.app/vistorias, observado em modo de consulta. Não selecionar identidades ou editar registros para investigar. Não foram alterados dados de negócio, regras ou permissões das vistorias.

## Base de manutenção aplicada

Migração 20261020022640_gestor_manutencao_base_privada aplicada em 19/10/2026 no horário do usuário (identificador em UTC). Schema gestor_manutencao com organizations, requests, request_events e request_attachments. Quatro tabelas vazias, RLS ativo, sem acesso de anon/authenticated/service_role e sem exposição nova na Data API. Sem FK para imóveis/equipe/vistorias existentes; referências lógicas e snapshots de código/endereço serão conferidos pelo backend.

Antes/depois: objetos antigos conferidos sem diferenças em colunas/defaults, função, gatilhos, RLS, proprietários, grants, constraints, índices e policies. Os alertas antigos de RLS/grants permanecem e não devem ser corrigidos automaticamente: o aplicativo de vistorias pode depender deles. O aviso informativo de RLS sem policies nas quatro tabelas novas é intencional até implementar identidade/autorização do runtime.

## Recuperação verificada

Painel confirmou plano Free, sem backups incluídos. Usuário não lembra a senha de conexão; autorizou exportação local e especificamente o fluxo de dados das oito tabelas pelo plugin/agente. Gravação direta de arquivo, sem registros pelo terminal e sem exibir valores pessoais. Sem redefinição de senha ou upgrade.

Cópia em backups/supabase/20261020T021543Z-aplicativo-19a54295: JSON, SQL e arquivo nativo aplicativo.public.dump. Snapshot de linhas em 19/10/2026 23:14:53, America/Sao_Paulo. Oito tabelas, 4.489 registros: 404 imóveis, 15 pessoas/equipe, 830 vistorias, 209 itens de checklist, 3.026 eventos, quatro itens padrão, um horário e zero linhas do objeto auxiliar preexistente.

Restaurada em PostgreSQL 17.11 local, exportada para arquivo nativo e restaurada em segundo banco. Três comparações completas confirmaram todos os registros, inclusive após testar manutenção na cópia. Fluxos SQL com dados fictícios/revertidos: vistoria, agenda/sobreposição, checklist, histórico, conclusão/finalização e isolamento do chamado. Servidor local encerrado. Não houve teste completo da interface do outro aplicativo contra a cópia.

Escopo: recuperação das oito tabelas do aplicativo e objetos públicos observados. Não é backup completo de todos os schemas, configurações e serviços Supabase. Metadados foram capturados separadamente das linhas. Auth/users, Storage/buckets e Storage/objects contavam zero na consulta; não presumir ausência em serviços externos. Backups têm ACL privada e são ignorados no Git, assim como .local-tools/. Nenhuma credencial fornecida do Supabase foi gravada; a senha do teste é exclusivamente local e protegida por DPAPI.

Evidência atual: docs/supabase/EXECUCAO-MANUTENCAO.md e execucao-verificada.json. SQL original executado: 001_manutencao_base.executado.sql, SHA256 FE439C352C2F68CE595CBB0B9EDB88A5E3D2187FF1070B34B31FD160256470FE. Conferências anteriores são registros históricos.

## Próximo trabalho

Próximo passo: completar o escopo funcional de vistorias locais (checklist/laudo e evidências conforme definição da operação) antes de integrar dados reais. Identificar usuário da equipe no Supabase e validar autorização por imobiliária antes de qualquer leitura ou gravação remota. Depois retomar o módulo de pedidos de manutenção e o portal do inquilino sem login. Não usar chave secreta no cliente nem abrir tabelas como atalho. Hospedagem, cobrança e alçadas comerciais continuam pendentes.

A chave secreta anteriormente compartilhada no chat continua com substituição pendente: atualizar os sistemas consumidores antes de revogar a antiga para preservar a operação. Nenhuma troca foi feita nesta tarefa.

## Consulta ao cofre

Antes de editar, consultar uma vez por tarefa D:\Cofre Obsidian\Server\00 - Inicio\CONTEXTO.md e somente notas pertinentes. Reutilizar o contexto enquanto escopo/fontes não mudarem. Código/documentação deste projeto são a fonte atual; o cofre registra decisões, evidências e limites. Não salvar credenciais ou dados reais no cofre.

## Agenda e aceite de vistoria — 31/10/2026

O calendário local agora bloqueia sobreposição pelo vistoriador, usa duração histórica por imóvel/tipo, aceita propostas pelo vistoriador designado e respeita 08:00–11:00 e 13:00–18:00. Exibe em aberto, em andamento e atrasadas com base nos prazos informados. Conclusão mantém aviso interno e gera somente rascunho de WhatsApp para revisão manual. Durações/fins históricos foram preenchidos no SQLite local com backup verificado; nenhuma escrita remota. As sugestões não excluem fins de semana, pois dias de operação não foram definidos.

## Cartões de vistoria — 31/10/2026

Os cartões identificam tipo, situação, imóvel/código SAMI, prazo, vistoriador, agendamento e solicitante; o tipo usa cores distintas e o solicitante fica em destaque. O nome do solicitante importado continua ligado ao `created_by` original. Protocolos artificiais `HIST-####` e códigos de imóveis históricos `HIST-<hash>` ficam armazenados localmente para rastreabilidade, mas não são exibidos nas telas. Códigos SAMI informados continuam preservados.
