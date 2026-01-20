# Banco de Dados - Cozinha ao Lucro

A estrutura do banco de dados está organizada da seguinte forma:

## 1. Arquivo Mestre (Recomendado)
*   **`SCHEMA_FINAL_V4.sql`**: Este é o arquivo consolidado mais recente. Se você for criar um banco do zero, USE APENAS ESTE ARQUIVO. Ele contém:
    *   Tabelas Core (Produtos, Clientes, Pedidos).
    *   SaaS (Subscriptions, Limites).
    *   Lógica de Estoque Negativo.
    *   Índices de Performance.

## 2. Histórico (Migrations)
A pasta `migrations/` contém o histórico incremental das mudanças. Se você já tem o banco rodando, pode usar os arquivos de migração mais recentes para atualizar partes específicas, mas o Schema V4 já unifica tudo.

## 3. Seeds
*   `seed-maria-doceira.sql`: Dados de demonstração para criação de screenshots ou testes de ambiente local.
