# Gestor Imob — base de manutenção criada e cópia recuperada

**19/10/2026 — estrutura criada no Supabase `novabase`.** As tabelas e permissões existentes do sistema de vistorias foram preservadas nas verificações de antes/depois. O painel Gestor Imob continua usando a demonstração local; ainda não está conectado aos dados reais.

## Estrutura criada

| Tabela em `gestor_manutencao` | Finalidade |
|---|---|
| `organizations` | Imobiliárias responsáveis pelos chamados e base de isolamento entre clientes. |
| `requests` | Protocolo, titular declarado, solicitante, contato, endereço completo, problema, descrição, prioridade, situação e conferência do vínculo ao imóvel. |
| `request_events` | Histórico e notas, internas por padrão. |
| `request_attachments` | Metadados de fotos/arquivos privados; não cria armazenamento ou implementa envio de fotos. |

As quatro tabelas estão **vazias, com RLS ativo e sem acesso pelos papéis `anon`, `authenticated` e `service_role`**. Não foram concedidos acessos de runtime ou exposto o schema na Data API. O proprietário administrativo conserva seus poderes. O Advisor informa ausência de policies nas quatro tabelas; isso é intencional nesta etapa fechada, até definir a identidade e as permissões do backend.

Não há FK das tabelas novas para imóveis, pessoas ou vistorias. O chamado guardará o UUID lógico do imóvel e uma cópia do código/endereço. Assim, a nova manutenção não impede que o sistema atual exclua um imóvel. O backend futuro deverá conferir a referência e tratar cadastros ausentes ou alterados. O vínculo informado pelo inquilino começa pendente de conferência. `people` continua representando equipe/vistoriadores, conforme confirmado pelo usuário.

Orçamentos, autorizações, prestadores, OS e financeiro ainda precisarão de evolução no Supabase. Não foi implementado módulo de vistorias no Gestor Imob.

## Cópia local e recuperação

O painel confirmou plano Free, sem backups incluídos. Como o usuário não lembra a senha PostgreSQL, foi autorizada expressamente a exportação das oito tabelas do aplicativo pelo plugin para o agente e a gravação no destino local. Não houve redefinição de senha ou contratação de plano.

A exportação usou uma única transação de leitura com snapshot consistente das linhas. A gravação foi feita diretamente por ferramenta de arquivos; nenhum valor individual de pessoas, endereços ou notas foi exibido na resposta. O destino privado está fora do Git, com ACL restrita ao usuário atual e ao sistema:

`E:\Novos projetos\Gestor_imob\backups\supabase\20261020T021543Z-aplicativo-19a54295`

O nome da pasta usa UTC. O snapshot corresponde a **19/10/2026 às 23:14:53, America/Sao_Paulo**.

| Tabela do aplicativo | Registros recuperados |
|---|---:|
| `properties` | 404 |
| `people` | 15 |
| `inspections` | 830 |
| `inspection_checklist_items` | 209 |
| `inspection_status_events` | 3.026 |
| `default_checklist_items` | 4 |
| `work_schedules` | 1 |
| `__codex_probe` | 0 |

Total: **4.489 registros**, iguais aos do snapshot em três comparações completas: após restaurar o JSON/SQL, após gerar e restaurar um arquivo nativo e após testar a nova estrutura na cópia. A função da tabela auxiliar preexistente continua desconhecida; ela foi preservada.

Arquivos principais na pasta privada:

- `aplicativo.snapshot.json`: 2.111.426 bytes; SHA256 `89849D0E07309D3188E0F63D951D7FD5D699228F11A08456B27C778F79AC3996`.
- `aplicativo-restaurar-local.sql`: 1.642.420 bytes; SHA256 `A072E596181BA012D139E87A1E78609F53DC8C6B0CA962E3638AD733F2CE38BB`.
- `aplicativo.public.dump`: 264.768 bytes; SHA256 `9640E05CAF955A7A371677F84ABE7729AAD37D244957D93E7E60A32B4CB0A3DD`.
- `validacao-restauracao.json`: resultados e limites do teste, produzido antes da aplicação remota.

**Escopo:** recuperação das oito tabelas do aplicativo e dos objetos públicos observados necessários à restauração. Não é backup completo do projeto Supabase: não inclui todos os schemas gerenciados, configurações de Auth, chaves, hospedagem, Edge Functions ou serviços externos. Metadados de esquema foram coletados separadamente das linhas. A contagem consultada de Auth/Storage era zero; isso não comprova ausência de arquivos em outros serviços.

## Validação e aplicação

Foi usado PostgreSQL **17.11 local**, da mesma versão principal do servidor 17.6. A cópia recuperou dados, dois enums, função de atualização, gatilhos, constraints, índices e permissões observadas das tabelas. O arquivo nativo foi restaurado em um segundo banco local.

Na cópia, uma transação com dados fictícios verificou criação/recebimento/agendamento de vistoria, recusa de sobreposição de horário, checklist, histórico, conclusão/finalização e operação de manutenção com isolamento entre organizações. A transação foi revertida. São testes SQL; **não houve teste completo da interface do site de vistorias apontando para a cópia**. A instância local foi encerrada ao concluir.

Após validar essa recuperação, a migração `20261020022640_gestor_manutencao_base_privada` foi aplicada no projeto real. O identificador da migração usa UTC; a aplicação ocorreu em 19/10/2026 no horário do usuário. SQL executado: SHA256 `FE439C352C2F68CE595CBB0B9EDB88A5E3D2187FF1070B34B31FD160256470FE`, preservado como evidência em `docs/supabase/001_manutencao_base.executado.sql`.

A conferência remota confirmou quatro tabelas novas, zero registros e zero FKs para schemas externos. A comparação das tabelas antigas confirmou igualdade de RLS, proprietários, privilégios, constraints, índices e policies; também foram comparadas colunas, valores padrão, função e gatilhos. Fingerprint antes/depois: `3570bd74529fd31a8f63d93801424b79`.

Os sete alertas antigos de [RLS desativado](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public) e os avisos de [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) e [extensão em public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) permaneceram. Não foram corrigidos nesta mudança para preservar o contrato do aplicativo existente. Nas tabelas novas, o aviso informativo de [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) corresponde ao acesso fechado intencional.

## Próxima etapa

Implementar o acesso do painel interno com identidade real e autorização por imobiliária, lendo os imóveis pelo backend e gravando os chamados nas tabelas novas. Não conectar dados reais às contas fictícias da demonstração. Depois implementar a abertura pública sem login, com dados declarados, conferência interna e fotos privadas.

Os documentos de planejamento e conferências anteriores são históricos; este registro e `execucao-verificada.json` descrevem o estado após a aplicação. Nenhuma credencial fornecida do Supabase foi salva. A senha gerada para o teste foi exclusivamente local, protegida por DPAPI na pasta privada.
