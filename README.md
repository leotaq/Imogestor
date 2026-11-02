# Gestor Imob

SaaS de gestão imobiliária, com vistorias como primeira etapa.

**Pasta oficial do projeto:** `E:\Novos projetos\Gestor_imob`.

## Estado atual

Versão local com autenticação por sessão e persistência SQLite. O login aceita usuário ou e-mail. A cópia local atual contém 417 imóveis reais, nove pessoas ativas da equipe e 859 vistorias com 3.154 eventos de situação; 682 têm horário de início agendado. Os dados foram carregados para consulta local em 31/10/2026; não há integração ao vivo com Supabase. Usuários importados têm identificadores locais, sem e-mail real no cadastro de origem, e papel interno `staff`. Vistorias e solicitações internas de confecção de contratos estão no escopo atual; manutenção continua como protótipo local. A versão não está pronta para produção.

## Abrir no computador

Requer Node.js 24, já disponível no ambiente de desenvolvimento. Não há dependências externas para instalar.

1. Abra `Iniciar_Gestor_Imob.cmd` ou execute `npm.cmd start` nesta pasta.
2. Acesse `http://127.0.0.1:4173` no navegador.
3. Entre com o usuário leonardo e a senha já cadastrada para essa conta.
4. Para encerrar, use Ctrl+C no terminal do servidor.

Na base local carregada, leonardo é a conta de Gestão; use a senha já cadastrada para essa conta. O atalho de demonstração foi removido e as três contas de demonstração da organização com os dados importados foram inativadas. Seus registros permanecem no histórico. Os dados e arquivos ficam neste computador; nada é enviado a serviço externo. Trate data/gestor.sqlite e backups como privados.

## O que já funciona

- Visão geral, lista com busca e filtros, cadastro e triagem de chamados.
- Cadastro de imóveis para vistoria com código SAMI, rua, número, complemento, bairro e cidade; consulta ao histórico do imóvel.
- Notas por público, mantidas como registros internos sem envio externo.
- Orçamentos por versão, registro de resposta externa e invalidação de autorização para novo escopo.
- OS de diagnóstico antes da proposta ou execução vinculada ao orçamento aprovado; agenda e conclusão.
- Custos, pagamentos externos parciais, histórico de eventos e exportação CSV.
- Anexos privados e controles de organização/papel na API.
- Pedidos de vistoria com imóvel, tipo, solicitante, prazo, vistoriador, duração prevista, agendamento, status e histórico; Kanban prioritário por padrão (situação Nova em destaque), lista opcional e agenda mensal de itens em aberto. Horários não se sobrepõem por vistoriador, propostas aguardam aceite e respeitam 08:00–11:00 e 13:00–18:00. A primeira conclusão avisa internamente a pessoa solicitante e oferece uma mensagem de WhatsApp para revisão manual; nada é enviado automaticamente.
- Solicitações internas de confecção de contratos de ocupação, aditivos ou outro motivo, vinculadas ao mesmo imóvel das vistorias; data da solicitação automática, prazo, informações adicionais, justificativa de atraso e envio à gestora com registro de data/hora. Alertas de prazo vencido aparecem no painel; o envio cria um aviso interno para quem solicitou.
- Painel local de equipe, restrito à Gestão: criar/editar contas, atribuir cargo/nomenclatura (Gestora, Gerente, Atendente, Assistente ou Vistoriador) separadamente do acesso, definir senha e ativar/inativar usuários. Acesso permanece nos perfis Gestão, Atendimento e Financeiro.
- No formulário de pedido, a equipe pode cadastrar um imóvel novo sem interromper o pedido. O código SAMI digitado é mantido no cadastro e no histórico da vistoria.

Consulte [o estado exato e as limitações](docs/ESTADO-IMPLEMENTACAO.md). Checklist, laudo, fotos da vistoria, portal externo e conexão ao Supabase ainda não foram implementados. O módulo de contratos controla pedidos e encaminhamento; não gera minuta jurídica nem coleta assinatura.

## Verificação e backup

Execute `npm.cmd test` para os testes de regras, HTTP e recuperação. Encerre o servidor antes de executar `npm.cmd run backup`: ele cria uma pasta nova em `backups/`, incluindo banco, anexos e manifesto de hashes, sem sobrescrever cópias anteriores. Procedimento de recuperação e estrutura técnica: [arquitetura local](docs/ARQUITETURA-LOCAL.md).

## Escopo

1. Prioridade atual: pedidos, agendamento e acompanhamento interno das vistorias, além do fluxo de solicitação e confecção interna de contratos.
2. Depois: conectar os módulos aos dados reais, com identidade e autorização próprias, e completar checklist/laudo conforme a operação.
3. Em etapa posterior: pedidos de manutenção e, depois, portal do inquilino sem login.

## Documentos

- [Contexto para continuar o projeto](CONTEXTO.md).
- [Inventário comparativo de sete plataformas, com fontes e limites](docs/01-inventario-comparativo.md).
- [Backlog de 32 itens, critérios de aceite e arquitetura proposta](docs/02-backlog-e-arquitetura.md).
- [Decisões, propostas e pendências](docs/DECISOES.md).
- [Regras para agentes e colaboradores](AGENTS.md).

## Primeiro ciclo de desenvolvimento

Base local: Node.js 24, SQLite e interface HTML/CSS/JavaScript. Além das contas fictícias, há nove contas locais da equipe, com nome de usuário gerado e senha inicial definida pelo usuário; as senhas ficam somente como hash com salt. O cadastro de origem não contém e-mails, por isso os e-mails dessas contas são endereços locais sintéticos e não recebem mensagens. A cópia contém 417 imóveis e 859 vistorias reais, com eventos de situação; 74 imóveis históricos sem correspondência atual ficam arquivados e fora dos cadastros selecionáveis. Checklists e as 10 atribuições de marketing ainda não são exibidos. O Supabase compartilhado não foi alterado nem integrado ao vivo. Conexão de produção depende de identidade da equipe e autorização por imobiliária.

O backlog distingue P0 (painel interno), P1 (portal e colaboração) e P2 (escala e automações). Usar as dependências e critérios de aceite para guiar a construção, sem implementar todo o backlog de uma vez.

## Referências e procedência

Os documentos de pesquisa foram copiados dos arquivos entregues na conversa de planejamento; o manifesto em `docs/PROVENIENCIA.json` registra origem e SHA-256. Fontes externas continuam sujeitas a mudança. Funcionalidades anunciadas ou documentadas não equivalem a teste de operação autenticada.

O projeto tem desenho e implementação próprios. Não copiar código, imagens, textos ou interfaces dos fornecedores analisados.
