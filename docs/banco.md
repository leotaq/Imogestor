# Banco de Dados - ImobiGestor

Banco utilizado:
PostgreSQL via Supabase.

## imobiliarias

id
nome
plano
created_at

## usuarios

id
imobiliaria_id
nome
email
senha
tipo
created_at

Tipos:

admin
gestora
vistoriador

## imoveis

id
imobiliaria_id
codigo
endereco
cidade
bairro
numero
proprietario
created_at

Esta tabela já existe no sistema de vistorias.

## vistorias

id
imovel_id
tipo_vistoria
data_solicitacao
data_execucao
status
vistoriador_id

Tabela herdada do sistema Visto.

## solicitacoes_manutencao

id
imobiliaria_id
imovel_id
solicitante_tipo
nome_solicitante
telefone
tipo_manutencao
descricao
data_abertura
prazo
status
created_at

Status possíveis:

aberta
orcamento
execucao
concluida

## prestadores

id
imobiliaria_id
nome
telefone
tipo_pagamento
emite_nota

## orcamentos

id
solicitacao_id
prestador_id
mao_obra
materiais
taxa_adm
total
prazo_execucao
aprovado

## execucao

id
solicitacao_id
orcamento_id
status
data_inicio
data_fim
observacoes

## financeiro

id
solicitacao_id
valor_total
taxa_adm
data_pagamento