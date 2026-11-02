> Registro histórico da preparação por senha. O usuário não lembrava a senha e autorizou a exportação pelo plugin. A cópia das oito tabelas foi recuperada e a base privada foi criada; consulte EXECUCAO-MANUTENCAO.md.

# Supabase — backup local: preparação e acesso necessário

19/10/2026. Login no painel confirmado no projeto **novabase**. O painel informa plano **Free**, sem backups de projeto incluídos. Nenhuma assinatura foi alterada e nenhuma restauração foi iniciada.

Foi preparado um PostgreSQL **17.11 portátil** a partir do [pacote oficial EDB](https://www.enterprisedb.com/download-postgresql-binaries), compatível em versão principal com o servidor PostgreSQL 17.6. `pg_dump` e `pg_restore` abriram e informaram sua versão. Nenhum serviço foi instalado. SHA256 do arquivo ZIP recebido: `80379B2C04D51C30225532E0AE04509899141E9957ED096FE749D7FD9DF8F82F` — conferência local de integridade, sem comparação com hash independente do fornecedor.

O painel Connect confirmou o Session pooler `aws-1-sa-east-1.pooler.supabase.com:5432` e usuário `postgres.pfakuvnuyixebvtmwmgu`. A conexão exige a senha existente do PostgreSQL, distinta das chaves da Data API. A senha não é mostrada pelo painel; ele apresenta somente um marcador. Não houve tentativa de redefinição ou busca de credenciais em outros projetos.

Foi preparado `scripts/backup-supabase.ps1`, na pasta `E:\Novos projetos\Gestor_imob`. Quando iniciado, ele recebe a senha em entrada protegida e a passa somente ao processo filho. Não a grava em arquivo, argumento ou configuração global. A exportação usa conexão TLS e sessões marcadas para leitura; espera por bloqueio é limitada. O destino é uma pasta exclusiva em `backups/supabase/`, fora do versionamento.

O script gera arquivo lógico em formato custom, tenta exportar papéis sem senhas, verifica a leitura do índice pelo `pg_restore` e registra tamanho/hash/status. **Verificar o índice não comprova restauração.** O script não restaura dados, não cria manutenção no Supabase e não corrige permissões atuais. Sua sintaxe foi validada; a exportação remota ainda depende da senha e não foi executada.

Uma consulta somente de leitura retornou: **0 usuários em Auth, 0 buckets e 0 objetos no Storage**, além das oito tabelas conhecidas em `public`. Isso cobre esse projeto nesse instante; não prova ausência de dados em serviços externos. O arquivo lógico não inclui arquivos de Storage nem configuração de hospedagem, Auth ou Edge Functions.

Pendência: o usuário foi consultado se possui a senha do banco, com orientação para não enviá-la no chat. Após a entrada local, gerar a cópia, testar a restauração em destino separado e só então retomar a validação das tabelas novas. **Nenhum backup testado existe ainda; o banco de produção permanece sem alterações.**

Referências: [backups no Supabase](https://supabase.com/docs/guides/platform/backups), [pg_dump PostgreSQL 17](https://www.postgresql.org/docs/17/app-pgdump.html).

Atualização de execução: a revisão automática de aprovação recusou a abertura da janela do processo de exportação por exigir autorização explícita para o conteúdo completo do banco e seu destino local. A janela não abriu e nenhum dado foi exportado. Foi solicitada ao usuário a autorização específica para copiar o banco completo para `E:\Novos projetos\Gestor_imob\backups\supabase\`. Não executar o script até essa autorização chegar. A senha existente continuará sendo digitada localmente, sem envio pelo chat.
