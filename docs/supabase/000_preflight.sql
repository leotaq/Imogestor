-- SOMENTE LEITURA: executar com acesso administrativo no ambiente escolhido.
-- Nao constitui backup. Revisao humana dos resultados e obrigatoria.
BEGIN TRANSACTION READ ONLY;
SELECT current_database(), current_user, current_setting('server_version');
SELECT nspname FROM pg_namespace WHERE nspname = 'gestor_manutencao';
-- Deve retornar zero schemas com esse nome; se existir, interromper.
SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role');
SELECT to_regprocedure('gen_random_uuid()') AS uuid_generator;
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name IN ('properties','people')
 ORDER BY table_name, ordinal_position;
SELECT evtname, evtevent, evtenabled, evtfoid::regprocedure AS handler
 FROM pg_event_trigger WHERE evtenabled <> 'D';
-- Event triggers podem reagir ao DDL novo; revisar seus efeitos antes de aplicar.
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind IN ('r','p') ORDER BY c.relname;
COMMIT;
