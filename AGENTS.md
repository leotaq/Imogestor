# Instruções do projeto Gestor Imob

## Início de uma tarefa

1. Ler `README.md` e `CONTEXTO.md`.
2. Consultar `D:\Cofre Obsidian\Server\00 - Inicio\CONTEXTO.md` uma vez por tarefa, conforme instrução do usuário. Se inacessível, informar a limitação.
3. Ler somente o documento e trecho do backlog relacionados ao trabalho. Não reler todo o acervo.
4. Confirmar o conteúdo atual antes de alterar arquivos. Preservar mudanças do usuário.

## Escopo e desenho

- Prioridade confirmada em 31/10/2026: pedidos, agendamentos e acompanhamento interno de vistorias; manutenção fica para a próxima etapa.
- Em 31/10/2026, o usuário também pediu o fluxo local de solicitação e confecção de contratos (ocupação, aditivo ou motivo manual), ligado ao cadastro compartilhado de imóveis. Isso acompanha a operação de vistorias e não autoriza conectar o Supabase nem gerar documentos jurídicos automaticamente.
- O sistema antigo é referência funcional pública. Não selecionar usuário, gravar ou alterar registros reais para investigar.
- A aplicação local usa SQLite e contas de demonstração. Exceção autorizada em 31/10/2026: a base ignorada `data/gestor.sqlite` recebeu 417 imóveis reais, somente ID/código/endereço; o campo local `name` repete o endereço e `unit`, `tenant`, `contact` e `owner` ficam vazios. Esses imóveis estão sob `org_id=aurora`, uma organização fictícia local; os seis imóveis fictícios existentes permanecem. Não houve sincronização nem escrita remota. Não conectar produção nem ampliar o uso de dados reais antes de definir identidade da equipe e autorização por imobiliária.
- Na mesma data, a cópia local recebeu nove pessoas ativas e 859 vistorias/3.154 eventos; cinco pessoas inativas preservam apenas referências históricas e não podem fazer login. Kanban é a visualização inicial, Nova fica em destaque e existe tema claro/escuro. Admin/atendimento cadastram imóveis durante a abertura do pedido; o código informado do SAMI é mantido no imóvel e no snapshot. Consulte `docs/ESTADO-IMPLEMENTACAO.md` para limites e evidências.
- Checklist, laudo, fotos da vistoria e portal externo ainda precisam ser detalhados antes de implementação.
- Portal de abertura de manutenção sem login é etapa futura, com os campos definidos no contexto.
- Não herdar decisões técnicas de Cabal ou Phoenix.
- Preservar a distinção entre chamado, orçamento, autorização, OS, execução e financeiro.
- Visita diagnóstica pode preceder proposta de reparo e tem autorização própria.
- Funcionalidade pesquisada, proposta de produto e comportamento implementado devem estar identificados separadamente.
- Criar design e código próprios; não copiar elementos protegidos dos fornecedores.

## Execução e validação

- Escolhas de tecnologia e decisões de produto ficam em `docs/DECISOES.md`, com justificativa e estado.
- Não descrever protótipo, dado fictício ou função simulada como operação de produção.
- Validar isolamento de organizações, permissões, visibilidade de notas/anexos e aprovação da versão correta quando essas funções forem implementadas.
- Backups precisam contemplar banco e arquivos reais, não só referências.
- Não versionar credenciais, dados reais de locatários, fotos privadas ou bancos de execução local.
- Ao concluir trabalho relevante, atualizar o contexto e a menor nota pertinente no cofre, com fonte, data, escopo e limitações. Não copiar conversas inteiras.
