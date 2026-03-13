# AI PROJECT SETUP - IMOBIGESTOR

Leia todo este documento antes de gerar qualquer código.

## Objetivo do projeto

Criar um sistema SaaS chamado ImobiGestor para gestão de imóveis, vistorias e manutenções imobiliárias.

O sistema será usado por imobiliárias para controlar:

- imóveis
- vistorias
- solicitações de manutenção
- orçamentos
- execução de serviços
- prestadores
- financeiro
- relatórios

## Stack tecnológica

Frontend:
Next.js

Linguagem:
TypeScript

Estilização:
TailwindCSS

Banco de dados:
Supabase (PostgreSQL)

Hospedagem:
Vercel

Autenticação:
Supabase Auth

## Arquitetura

O sistema será um SaaS multi-tenant.

Cada registro do banco deverá possuir:

imobiliaria_id

Isso garante que cada imobiliária veja apenas seus próprios dados.

## Estrutura de pastas esperada

src/

app/
layout.tsx
page.tsx

login/
page.tsx

dashboard/
page.tsx

imoveis/
page.tsx
novo/
page.tsx
[id]/
page.tsx

vistorias/
page.tsx
nova/
page.tsx

manutencoes/
page.tsx
nova/
page.tsx
[id]/
page.tsx

orcamentos/
page.tsx
novo/
page.tsx

prestadores/
page.tsx
novo/
page.tsx

execucao/
page.tsx

financeiro/
page.tsx

relatorios/
page.tsx


components/

layout/
Sidebar.tsx
Header.tsx

ui/
Button.tsx
Input.tsx
Select.tsx
Modal.tsx
Table.tsx

forms/
ImovelForm.tsx
ManutencaoForm.tsx
OrcamentoForm.tsx


lib/

supabaseClient.ts
auth.ts
utils.ts


services/

imoveisService.ts
vistoriasService.ts
manutencoesService.ts
orcamentosService.ts
prestadoresService.ts
financeiroService.ts


types/

database.types.ts
imovel.types.ts
vistoria.types.ts
manutencao.types.ts
usuario.types.ts


## Banco de dados

Tabelas principais:

imobiliarias
usuarios
imoveis
vistorias
solicitacoes_manutencao
prestadores
orcamentos
execucao
financeiro

## Fluxo do sistema

1 - cadastro de imóvel

2 - vistoria do imóvel

3 - solicitação de manutenção

4 - inclusão de orçamentos

5 - escolha do prestador

6 - execução do serviço

7 - finalização

8 - registro financeiro

## Dashboard

O dashboard deverá mostrar:

- solicitações abertas
- solicitações em execução
- solicitações concluídas
- custo total de manutenção
- taxa administrativa gerada

## Funcionalidades futuras

- upload de fotos
- histórico de manutenção
- notificações
- integração com WhatsApp
- geração de relatórios
- planos SaaS

## Instruções para a IA

1. Criar a estrutura completa de pastas.
2. Criar os arquivos base do projeto Next.js.
3. Criar conexão com Supabase.
4. Criar layout base com sidebar.
5. Criar página inicial do dashboard.
6. Criar services básicos para banco de dados.
7. Utilizar TypeScript em todo o projeto.