-- Adiciona o campo de complemento ao cadastro de imoveis
alter table if exists imoveis
  add column if not exists complemento text null;
