# Validação da primeira versão local

Data de referência do usuário: 19/10/2026, America/Sao_Paulo. Pasta oficial: `E:\Novos projetos\Gestor_imob`.

## Resultado

11 testes automatizados passaram na pasta oficial, usando Node.js 24.19.0 e `npm.cmd test`. A execução que inclui HTTP local exigiu permissão de rede loopback no ambiente do agente; as primeiras falhas EACCES do sandbox não eram falhas do aplicativo. Os testes não usam o banco de demonstração.

Cobertura: isolamento de organizações/referências/anexos, papéis, sessão, origem e cabeçalho antirrequisição cruzada, revisão de orçamento, autorização diagnóstica, transição/edição concorrente, solução/encerramento/reabertura, pagamento parcial, CSV sem notas internas/fórmulas, snapshot de titular/endereço e recuperação de banco e conteúdo de anexo.

## Navegador

Conferido pela interface local:

1. Entrada pela conta fictícia de demonstração.
2. Criação do chamado fictício CH-1049 e abertura de seu detalhe.
3. Triagem e atribuição a responsável.
4. Orçamento de R$ 155,00 com dois itens e versão identificada.
5. Registro explícito de resposta externa fictícia.
6. OS de execução ligada ao escopo/prestador/valor aprovados, com data e horário.
7. Busca pelo chamado e navegação em imóveis, prestadores, agenda e relatórios.
8. Reinício do servidor e confirmação de que o chamado continuou salvo.

A apresentação responsiva foi conferida por árvore de acessibilidade, interação e medidas de elementos em tela estreita e ampla. A interface móvel inclui saída da conta. As tabelas usam seu próprio contêiner de rolagem.

**Limite visual:** a ferramenta de captura do navegador retornou timeout/“Unable to capture screenshot”; não foi possível concluir inspeção por pixels nem gerar imagem real da tela. Nenhuma imagem artificial foi usada como prova. A conferência visual fina de tipografia, espaçamento e cores permanece pendente, embora a navegação e os formulários tenham sido exercitados.

O console não apresentou erros durante a verificação final. O ajuste temporário de viewport foi restaurado.

## Persistência e cópia

Arquivos preparados foram sincronizados para a pasta oficial com comparação SHA-256 e proteção contra mudanças concorrentes. A documentação de pesquisa original foi preservada. Foi gerado um backup real da demonstração, com banco e diretório de anexos; o teste de recuperação usa também um anexo fictício com conteúdo e hash verificados.

Dados de validação são deliberadamente fictícios e ficam apenas no banco local ignorado pelo Git. A aplicação não foi publicada e não movimentou dinheiro nem enviou mensagens a terceiros. A prévia temporária do agente é encerrada após os testes; para continuar, abrir `Iniciar_Gestor_Imob.cmd`.

## Próximo ciclo

Revisar a experiência com o usuário, normalizar pessoas/unidades/locações, implementar gestão de usuários e alçadas, completar os critérios P0 pendentes e fazer revisão de implantação antes de usar dados reais. Portal público e vistorias permanecem fora desta versão.
