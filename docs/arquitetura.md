# Arquitetura do Sistema - ImobiGestor

ImobiGestor é um sistema SaaS para gestão imobiliária focado em:

- vistorias
- manutenções
- controle de prestadores
- execução de serviços
- controle financeiro

Este sistema evolui do projeto "Visto", que já realiza o gerenciamento de vistorias.

## Tecnologias

Frontend:
Next.js
React
TailwindCSS

Backend:
Next.js API Routes

Banco de dados:
Supabase (PostgreSQL)

Hospedagem:
Vercel

## Estrutura do Sistema

Dashboard

Imóveis
Cadastro e consulta de imóveis.

Vistorias
Sistema herdado do projeto Visto.

Manutenções
Registro de solicitações de manutenção.

Orçamentos
Comparação de orçamentos de prestadores.

Execução
Acompanhamento da execução do serviço.

Prestadores
Cadastro de prestadores de serviços.

Financeiro
Controle de custos e taxas administrativas.

Relatórios
Análise de dados e desempenho.

## Arquitetura SaaS

O sistema deverá suportar múltiplas imobiliárias.

Cada registro no banco deverá conter:

imobiliaria_id

Isso garante isolamento de dados entre clientes.