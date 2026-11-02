# SaaS de manutenção imobiliária — backlog e arquitetura proposta

Proposta de produto em **19/10/2026**, America/Sao_Paulo. Referência: [inventário com fontes e limites](01-inventario-comparativo.md). Todos os requisitos deste arquivo são **P — propostas originais**, não afirmações adicionais sobre concorrentes. Os IDs R/S/L/V/T/M/D apontam às evidências do inventário.

**Repriorização confirmada em 31/10/2026:** o foco ativo passou a ser vistorias: pedidos internos, atribuição, agendamento e acompanhamento conforme a referência funcional antiga. Este arquivo continua sendo o backlog original de manutenção e deve ser retomado depois da primeira etapa de vistorias.

## Objetivo e recorte

Permitir que a imobiliária acompanhe cada manutenção desde o primeiro contato até a solução, mantendo responsabilidade, autorização, execução, comunicação e custo rastreáveis.

**Primeira entrega:** painel interno para a equipe. Pedidos recebidos por telefone, WhatsApp ou e-mail são lançados pela equipe; não depender de integrações para começar.

**Etapa posterior:** portal público de abertura, sem conta e sem login, com nome do titular da locação, endereço completo, contato, tipo de problema, descrição e fotos. A abertura não concede acesso à locação ou ao histórico privado.

**Nota histórica, supersedida em 31/10/2026:** a proposta anterior era apenas preparar a origem e não desenvolver vistorias. O usuário mudou a prioridade; veja a atualização acima. Checklist, laudo e comparação entrada/saída continuam sem especificação funcional suficiente.

## Prioridades e dependências

| Prioridade | Resultado esperado | Regra para entrar |
|---|---|---|
| **P0 — painel interno** | Operação piloto completa, inclusive exceções, usando registros feitos pela equipe. | Necessário para receber, decidir, executar, fechar e prestar contas. |
| **P1 — colaboração e portal** | Reduzir digitação e troca de mensagens; abrir entrada pública com controle do vínculo. | P0 estável; cada capacidade pode ser liberada separadamente. |
| **P2 — escala e automação** | Preventiva, regras, integrações e inteligência. | Dados/eventos confiáveis e demanda observada no piloto. |

Não há estimativa em semanas sem conhecer equipe, tecnologia, volume e integrações. Esforço relativo: **S** pequeno, **M** médio, **L** grande; não é compromisso de prazo.

## P0 — painel da imobiliária

| ID | Funcionalidade e valor | Critério de aceite verificável | Depende / esforço / referência |
|---|---|---|---|
| **B01** | Organizações, contas e papéis internos: administrador, atendimento, gestor e financeiro. | Usuário só acessa sua organização; atendimento não pode aprovar acima da sua alçada nem marcar pagamento sem permissão. A API aplica a regra, inclusive em arquivos/exportações. | — / L / D11, V3 |
| **B02** | Cadastros mínimos de imóvel, unidade, pessoas e locação. | Imóvel tem código e endereço; unidade tem complemento; locação guarda titular e vigência. Troca de locatário não muda chamados antigos. Área comum pode ter imóvel sem unidade/locação. | B01 / M / L1, M1 |
| **B03** | Abertura interna e protocolo. | Equipe informa origem, solicitante/contato, local, tipo, descrição e fotos disponíveis; sistema gera protocolo único. Rascunho ou pendência de identificação não exige inventar locação. | B02, B06 / M / D1, S2 |
| **B04** | Triagem e responsabilidade operacional. | Gestor confirma imóvel/locação, categoria, prioridade, responsável e prazo. Urgência relatada pelo solicitante fica separada da prioridade atribuída. Há espera com motivo, duplicidade e cancelamento com justificativa. | B03, B16 / M / M1, D1 |
| **B05** | Caixa de entrada e painel de pendências. | Busca por protocolo/endereço/titular; filtros por situação, responsável, categoria, prestador, prazo e prioridade. Cartões de não atribuídos, vencidos e aprovações pendentes abrem a lista correspondente. | B04 / M / D2, L1 |
| **B06** | Anexos de manutenção com metadados. | Upload informa sucesso/falha por arquivo, mantém legenda, autor e etapa; arquivo tem organização e público definidos. Tipo/tamanho são verificados; link privado não é acessível fora do escopo. | B01 / M / M4, D3 |
| **B07** | Linha de conversa com notas internas separadas. | Cada mensagem registra autor, data e público. Prévia identifica destinatários; notas internas não entram em resumo externo ou OS sem seleção expressa. Histórico de alterações é preservado. | B01, B03, B16 / M / M8, L1, D3 |
| **B08** | Cadastro de prestadores da imobiliária. | Nome/empresa, especialidades, área atendida, contatos, situação ativo/inativo e observações internas. Inativação mantém histórico; não permite atribuição nova sem ação do gestor. | B01 / S / R3, D5 |
| **B09** | Orçamento por itens e versão. | Material, mão de obra, deslocamento e total; prazo/validade, anexo e fornecedor. Revisão gera nova versão; orçamento anterior fica consultável e não é sobrescrito. Proposta lançada pela equipe tem autoria explícita. | B03, B06, B08 / M / M5, M14 |
| **B10** | Autorização para executar e registro de aprovação externa. | Registra pessoa autorizadora, papel, origem da decisão, data, escopo/valor e comprovante. Reparo aponta à versão do orçamento; visita diagnóstica pode ter autorização própria antes dessa proposta, com custo ou teto explícito. Aprovação lançada pelo atendente preserva essa autoria. Mudança de valor/escopo exige nova autorização. | B16; B09 para reparo orçado / M / M6/M7, D4, L1 |
| **B11** | OS vinculada e agenda simples. | Chamado admite várias OS, de diagnóstico, execução ou retorno, com prestador, escopo autorizado, data/horário, acesso e anexos selecionados. Diagnóstico pode anteceder orçamento do reparo, com autorização própria e custo explícito, inclusive quando gratuito. Agenda combinada é distinta de data sugerida. | B08/B10; B09 para reparo orçado / L / D3/D4, R4 |
| **B12** | Acompanhamento da execução. | Equipe registra início, progresso, impedimento e conclusão, com quem informou e quando. Serviço extra não altera silenciosamente o orçamento aprovado; volta para autorização complementar. | B11, B16 / M / M9, S1 |
| **B13** | Encerramento, confirmação e reabertura. | Concluir OS exige solução e evidência ou justificativa de ausência. Concluir uma OS não fecha automaticamente outras pendentes. Chamado distingue solucionado de encerrado; contestação reabre com motivo e preserva a execução anterior. | B11/B12, B16 / M / L1, M9 |
| **B14** | Financeiro gerencial da manutenção. | Guarda previsto, aprovado e realizado; pagador(s), obrigação, vencimento, documento e registro de pagamento parcial/total. Soma dos rateios fecha o valor. Não transfere dinheiro nem lança cobrança de aluguel automaticamente. | B09–B11 / M / M10/M11, D4 |
| **B15** | Histórico e relatório básico por imóvel. | Linha do tempo atravessa locações; lista de abertos/vencidos, prazo de resolução, custos e reaberturas pode ser filtrada/exportada. Total e recorte do arquivo conferem com a tela; campos internos seguem a permissão. | B05, B13/B14 / M / M12, L1 |
| **B16** | Auditoria e transições rastreáveis. | Mudanças de situação, responsável, orçamento, aprovação, compartilhamento e financeiro guardam ator/data/motivo. Registro não é editável pelo atendente. Operações concorrentes não perdem atualização. | B01 / M / M1, V1 |
| **B17** | Operação SaaS e recuperação. | Onboarding, monitoramento de falhas e restauração ensaiada do banco e dos próprios anexos, com abertura/conferência dos arquivos recuperados. Erro de upload/exportação não aparece como sucesso. Acesso e isolamento têm verificações automatizadas significativas. | B01/B06/B16 / L / requisito próprio |

**Ordem de construção sugerida:** B01+B16+B17 → B02+B06+B08 → B03+B04+B07 → B05 → B09+B10 → B11+B12+B13 → B14+B15. Parte de B17 acompanha todas as etapas. O piloto só está completo quando uma demanda percorre orçamento, autorização, execução, encerramento e prestação de contas.

## P1 — colaboração e portal futuro

| ID | Funcionalidade | Critério de aceite verificável | Depende / esforço / referência |
|---|---|---|---|
| **B18** | Portal público de abertura sem login. | Link da imobiliária abre formulário móvel com os campos definidos abaixo; nenhuma senha, conta ou CPF é exigido. Envio mostra protocolo e confirmação de recebimento. Reenvio do mesmo envio não duplica chamado. | B03/B06/B17, B19 / L / S2 + requisito do usuário |
| **B19** | Identificação assistida, antiabuso e contato declarado. | Nome/endereço/contato chegam como declarados; equipe confirma vínculo. Nenhuma busca pública lista locações ou revela se alguém é cliente. Limites de envio/upload e tratamento de erro são aplicados. Divergência vai para triagem, sem associação automática definitiva. | B02/B04/B17 / M / requisito próprio |
| **B20** | Acompanhamento privado após a abertura. | A abertura continua sem login. Se habilitado, acompanhamento usa link/token aleatório limitado ao pedido, com expiração/revogação e contato verificado por mecanismo escolhido. Protocolo sequencial/nome/endereço sozinhos não liberam detalhes. | B18/B19, B07 / M / contraste S3/M3 |
| **B21** | Aprovação digital do proprietário por solicitação restrita. | Destinatário e autoridade definidos pela imobiliária; mostra versão, valor e escopo exatos. Aprovar/recusar gera evidência; solicitação vencida ou versão substituída não autoriza trabalho novo. | B10/B19/B16 / M / M6/M7 |
| **B22** | Área limitada para o prestador. | Prestador vê apenas OS atribuídas e informações necessárias; aceita/recusa, sugere agenda e envia execução/documentos. Não vê notas internas, outros imóveis ou dados financeiros da locação. | B11/B12, B01 / L / M5/M8, D6/D7 |
| **B23** | Comparar cotações e visitas de diagnóstico. | Solicita proposta a múltiplos prestadores; compara mesmo escopo/versão, total, validade e prazo. Aceitar fazer orçamento não autoriza executar. Custo da visita é explícito e aprovado separadamente quando existir. | B09–B11 / M / M4/M5, R4 |
| **B24** | Disponibilidade e confirmação de agenda. | Solicitante/prestador indicam janelas; equipe confirma uma visita e registra reagendamento/ausência. Evita conflito do mesmo prestador quando houver dados suficientes; mantém histórico. | B11/B22 / M / M2/M5 |
| **B25** | Notificações reais por evento. | Começar por e-mail transacional; depois WhatsApp via integração oficial se necessário. Destinatários, modelo, tentativa e resultado ficam registrados; falha tem reprocessamento sem duplicar eventos. Não confundir abrir WhatsApp com envio integrado. | B07/B16/B17 / L / R5, D14, limites V2 |
| **B26** | Relatórios de gestão e avaliação. | Gargalos, custos por imóvel/categoria, prazo por prestador, reabertura e satisfação, com definição explícita de período/coorte. Amostra pequena ou dado ausente não gera ranking enganoso. | B15, B22/B24 / M / M12, L1 |

## P2 — expansão após validar a operação

| ID | Funcionalidade | Critério de aceite verificável | Depende / esforço |
|---|---|---|---|
| **B27** | Manutenção preventiva/recorrente. | Programação é distinta da OS gerada; recorrência não cria duplicatas; pausa preserva histórico; define se próxima data vem do calendário ou da última execução. | B11/B13/B25 / M |
| **B28** | Integração com ERP/locação/contabilidade. | Sincroniza IDs externos e registros necessários com reconciliação, fila de erros e idempotência. Financeiro da manutenção não vira cobrança sem regra e autorização. | B02/B14/B17 / L |
| **B29** | Pagamentos, repasses e conciliação. | Só após decisão de negócio sobre quem cobra/paga. Integração em sandbox prova aprovação, resultado financeiro, falha, estorno e reconciliação; registro manual não se passa por transação. | B14/B28 / L |
| **B30** | Regras e SLA configuráveis. | Política por categoria/prioridade, horários e pausas; automações deixam motivo e trilha. Não encerra demanda sem solução por expiração de orçamento. | B04/B16/B25/B26 / L |
| **B31** | Assistência por IA supervisionada. | Sugere categoria, resumo ou perguntas com confirmação humana. Não decide responsabilidade contratual, despesa ou autorização. Mede correções e falhas antes de automatizar qualquer ação. | B04/B07/B26 / L |
| **B32** | Evolução comercial do SaaS. | Planos, limites e faturamento da assinatura somente após definir modelo comercial. Limites não apagam histórico e bloqueios não silenciam demandas já recebidas. | B17 e piloto validado / M |

**Vistorias:** ficam fora destas prioridades de implementação. Uma fase futura poderá ser especificada separadamente quando houver autorização e requisitos; sua integração técnica já está prevista abaixo.

## Fluxo operacional original

```mermaid
flowchart LR
  A[Registro pela equipe] --> B[Triagem]
  F[Portal público futuro] -.-> B
  B --> C[Orçamento versionado]
  B -->|Diagnóstico necessário| X[Autorização da visita]
  X --> Y[OS diagnóstica]
  Y --> C
  C --> D[Autorização]
  D --> E[OS e agenda]
  E --> G[Execução e evidências]
  G --> H[Solução e confirmação]
  H --> I[Encerramento]
  H -->|Ainda não resolveu| B
  G --> J[Custo e obrigação]
  J --> K[Registro de pagamento]
```

Chamado sem necessidade de serviço pode ser resolvido na triagem com motivo. Quando é preciso avaliar o local antes de orçar o reparo, autorizar e agendar uma visita diagnóstica com escopo e custo próprios; sua conclusão alimenta a proposta do reparo. Recusa de orçamento permite outra cotação; não cancela automaticamente a demanda. Troca de prestador ou serviço adicional preserva OS e aprovações anteriores. Pagamento pode seguir pendente depois de resolvido o problema.

| Objeto | Estados propostos | Regra central |
|---|---|---|
| Chamado | Novo, Em triagem, Em atendimento, Aguardando, Solucionado, Encerrado, Cancelado | Aguardando tem motivo, responsável pelo próximo passo e data de revisão. |
| Orçamento/versão | Rascunho, Enviado, Em análise, Aprovado, Recusado, Substituído, Vencido | Aprovação aponta para uma versão imutável. |
| OS | Rascunho, Autorizada, Agendada, Em execução, Concluída, Não executada, Cancelada | Conclusão da OS não significa pagamento nem aceite final do chamado. |
| Despesa/obrigação | Prevista, A pagar, Parcialmente paga, Paga, Contestada, Cancelada | Valor, pagador e comprovante são próprios; não reutilizar status do chamado. |

Procedimento urgente pode ter alçada prévia definida pela imobiliária. Na ausência de política, não criar autorização automática apenas por marcar “urgente”. A responsabilidade pelo pagamento é registrada por pessoa autorizada com justificativa e evidência; não é deduzida da categoria ou do nome do solicitante.

## Portal sem login — especificação da fase futura

| Bloco | Campos e comportamento propostos |
|---|---|
| Imobiliária | Identificada pelo link/domínio; visitante não escolhe IDs internos de organização. |
| Titular | Nome completo do titular da locação, obrigatório. Campo separado para nome de quem está preenchendo e relação com o titular, quando diferente. |
| Endereço completo | CEP quando conhecido, logradouro, número ou “sem número”, complemento/unidade ou “não se aplica”, bairro, cidade e UF. Correção manual disponível quando busca por CEP falhar. |
| Contato | Telefone com DDD ou e-mail como contato obrigatório; oferecer ambos e preferência de retorno. Contato verificado depois não implica titularidade da locação. |
| Problema | Tipo: hidráulica, elétrica, infiltração, fechadura/acesso, equipamento, estrutura, área comum ou outro. Descrição obrigatória; local do problema e urgência percebida como dados auxiliares. |
| Fotos | Permitir várias com prévia, legenda, remoção e progresso. Proposta inicial: até 10 fotos, 10 MB cada; parâmetros revisáveis. Permitir enviar sem foto com justificativa, evitando bloquear recebimento de demanda urgente. |
| Disponibilidade | Informação opcional; não confirmar visita automaticamente. Autorização de entrada deve ser específica e registrada quando a agenda exigir. |
| Confirmação | Resumo antes do envio, número de protocolo e confirmação de recebimento. Não expor contrato, CPF, proprietário ou chamados anteriores. |

Formulário público cria uma entrada com dados declarados. O vínculo definitivo a imóvel/unidade/locação é confirmado pela equipe ou por mecanismo adicional validado. Nunca usar nome/endereço como prova suficiente de identidade. A versão inicial dispensa CPF do titular e do proprietário.

Fotografias podem conter pessoas ou informações pessoais: acesso privado, limites de arquivo, verificação do conteúdo, miniaturas próprias e tratamento de metadados fazem parte da implementação. Política de retenção e aviso de uso de dados precisam refletir a operação real; não foi feita análise jurídica nesta entrega.

## Arquitetura preparada para crescer

Recomendação inicial: **aplicação modular única**, API e banco relacional, arquivos privados em armazenamento de objetos e fila para notificações/exportações. Isso permite começar pequeno sem misturar as responsabilidades. Não exige microsserviços.

| Módulo | Entidades principais | Relações que devem ser preservadas |
|---|---|---|
| Organização e acesso | Organização, Usuário, Vínculo, Papel, Permissão | Organização identifica a imobiliária; usar termo distinto de inquilino. |
| Carteira mínima | Pessoa, Contato, Imóvel, Unidade, Locação, Parte da locação | Vínculos com vigência; pessoa pode ter mais de um papel. Sem motor completo de contratos/aluguel. |
| Atendimento | Chamado, Entrada, Categoria, Histórico de estado | Dados declarados separados de dados confirmados; origem interna/portal/importação/futura vistoria. |
| Fornecimento | Prestador, Solicitação de orçamento, Orçamento, Versão, Item, Aprovação | Decisão sobre reparo aponta à versão; autorização diagnóstica registra escopo/custo próprios antes da proposta. Ambas preservam ator/autoridade. |
| Execução | OS, Visita, Agendamento, Atualização, Evidência de conclusão | Várias OS por chamado, visita distinta de execução, cancelamento sem apagar registros. |
| Comunicação | Mensagem, Público, Anexo, Entrega de notificação | Nota interna não é mensagem externa; arquivo compartilhado tem concessão explícita. |
| Custos | Custo, Obrigação, Rateio, Registro de pagamento | Orçado ≠ autorizado ≠ realizado ≠ pago; link opcional à OS e referência obrigatória ao chamado. |
| Auditoria | Evento, Ator, Data, Alteração, Motivo | Registrar estado anterior/novo e origem; sem depender de logs efêmeros da aplicação. |

Todas as entidades de negócio carregam escopo da organização, inclusive arquivos, eventos e tarefas assíncronas. Índices e relacionamentos impedem vincular uma OS de uma empresa ao imóvel de outra. Autorização ocorre no servidor; regras no banco podem adicionar proteção. Não deduzir isolamento a partir de filtro na tela.

Dados essenciais ficam em colunas/relacionamentos próprios. Configuração de categorias e campos auxiliares pode ser extensível, mas evitar guardar todo o chamado num campo genérico. IDs públicos aleatórios e protocolo legível têm funções diferentes. Datas são guardadas com referência temporal consistente e exibidas no fuso da operação.

Para a integração futura com vistorias, prever `origem_tipo`, `origem_id` e uma relação de referências externas versionável. Quando o módulo existir, itens/constatações poderão gerar chamados com vínculo à sua origem. **Não criar agora tabelas de laudo nem exigir vistoria para abrir manutenção.** Anexos compartilhados precisam preservar procedência e público autorizado.

Eventos como `chamado_criado`, `orcamento_revisado`, `aprovacao_registrada`, `os_concluida` e `pagamento_registrado` alimentam auditoria e fila de notificações. Gravar evento e mudança de negócio de maneira consistente; reprocessar sem duplicar entrega ou obrigação financeira. Isso sustenta integrações futuras sem prometer automações inexistentes.

## Telas para a primeira versão

| Tela | Conteúdo necessário |
|---|---|
| Início | Pendências acionáveis e atalhos para não atribuídos, vencidos, aprovações e visitas de hoje. |
| Chamados | Lista, busca e filtros; cadastro pela equipe; destaque de possível duplicidade. |
| Detalhe do chamado | Resumo/imóvel/locação; responsáveis e prazo; linha do tempo; comunicação; anexos; orçamentos/aprovações; OS; custos. |
| Agenda | Visitas confirmadas e sem confirmação; filtros por equipe/prestador. |
| Imóveis/unidades | Cadastro mínimo e histórico de manutenção atravessando locações. |
| Prestadores | Especialidades, contatos, situação e serviços anteriores. |
| Relatórios | Pendências, tempo, custo e exportação respeitando permissões. |
| Administração | Equipe, papéis, categorias, alçadas e configurações da organização. |

Layout, nomenclatura final e componentes visuais devem ser desenhados para esse fluxo, sem reproduzir telas dos fornecedores.

## Indicadores e conclusão do piloto

Definições iniciais: **primeira resposta** é a primeira interação humana após recebimento; **tempo de resolução** vai de recebimento à solução; **idade aberta** usa chamados ainda não solucionados; **reabertura** conta retorno após solução; **custo realizado** usa despesas confirmadas, sem misturar valores orçados. Relatório deve informar período, inclusão por abertura/solução/pagamento e tratamento das pausas.

Verificação mínima para aceitar P0:

1. Duas imobiliárias de teste não enxergam nem alteram cadastros, arquivos ou exportações uma da outra.
2. Um chamado percorre triagem → proposta → autorização da versão correta → OS → solução → encerramento, preservando autores e datas. Outro caso permite diagnóstico autorizado antes da proposta do reparo, sem autorizar o reparo por consequência.
3. Revisão de orçamento invalida uso da autorização antiga para novo escopo; atendimento sem alçada não autoriza por conta própria.
4. Nota interna e anexos não autorizados não aparecem em resumo externo ou na OS compartilhada.
5. Troca de locatário, cancelamento, serviço não executado, impedimento e reabertura mantêm histórico coerente.
6. Pagamento parcial não altera a situação operacional; soma de rateios e custos confere com o relatório.
7. Restauração em teste recupera banco e arquivos do armazenamento de anexos; fotos, comprovantes e documentos restaurados abrem e conferem com o conteúdo de origem. Falhas de entrega/upload não geram sucesso falso.

São testes de comportamento e limites de confiança, não testes que apenas repetem a implementação. B18–B25 exigirão verificações adicionais de token, envio duplicado, público externo e limites de upload quando essas fases forem construídas.

## Decisões e pendências para especificação detalhada

Já definido pelo pedido: manutenção agora; painel interno primeiro; portal futuro sem login; nome do titular, endereço, contato, tipo, descrição e fotos; arquitetura extensível a vistorias.

Antes de estimar a implementação: confirmar volume inicial de imóveis/chamados, quantidade de operadores, regras de alçada, quem paga cada serviço, necessidade de aprovação do proprietário e modo de comunicação prioritário. Essas decisões não impedem começar o desenho do painel e da modelagem acima.

Depois do piloto: decidir se haverá operação assistida, marketplace ou somente software; se o financeiro continuará gerencial ou fará transações; quais integrações têm demanda real. Vistorias permanecem uma fase independente, ainda não autorizada para desenvolvimento.
