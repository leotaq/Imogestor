create table imobiliarias (
id uuid primary key,
nome text,
plano text,
created_at timestamp default now()
);

create table usuarios (
id uuid primary key,
imobiliaria_id uuid,
nome text,
email text,
tipo text,
created_at timestamp default now()
);

create table imoveis (
id uuid primary key,
imobiliaria_id uuid,
codigo text,
endereco text,
cidade text,
bairro text,
numero text,
proprietario text
);

create table vistorias (
id uuid primary key,
imovel_id uuid,
tipo_vistoria text,
data_solicitacao timestamp,
data_execucao timestamp,
status text
);

create table solicitacoes_manutencao (
id uuid primary key,
imovel_id uuid,
solicitante_tipo text,
nome_solicitante text,
telefone text,
tipo_manutencao text,
descricao text,
prazo date,
status text
);