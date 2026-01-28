# Cozinha ao Lucro 🧁🚀

> **Transforme sua cozinha em um negócio lucrativo.**

**Cozinha ao Lucro** é uma plataforma de gestão completa projetada para pequenas confeitarias e confeiteiros autônomos. Ela ajuda você a calcular custos com precisão, gerenciar estoque, rastrear pedidos e entender suas margens de lucro.

---

## 📚 Documentação

Temos uma documentação detalhada para te ajudar a começar:

- **[Guia do Usuário](docs/USER_GUIDE.md)**: Como usar o dashboard, gerenciar pedidos e criar produtos.
- **[Guia do Desenvolvedor](docs/DEVELOPER_GUIDE.md)**: Estrutura do projeto, tecnologias e diretrizes de contribuição.
- **[Schema do Banco de Dados](docs/DATABASE_SCHEMA.md)**: Detalhamento das tabelas e relacionamentos do Supabase.
- **[Arquitetura](docs/ARCHITECTURE.md)**: Visão geral da arquitetura (Inglês/Técnico).

---

## ✨ Funcionalidades Chave

- **📊 Dashboard Inteligente**: Metas de vendas em tempo real, rastreamento de lucro e insights do negócio.
- **📝 Gestão de Pedidos**: Quadro estilo Kanban para rastrear pedidos de "Pendente" até "Entregue".
- **🍰 Ficha Técnica Inteligente**: Cálculo automático de preços de venda válidos baseados no custo dos ingredientes.
- **📦 Controle de Estoque**: Baixa automática de inventário conforme pedidos são concluídos.
- **👥 CRM de Clientes**: Histórico de compras e preferências dos clientes.

---

## 🛠️ Tecnologias

Este projeto foi construído usando tecnologias web modernas:

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Estado**: [TanStack Query](https://tanstack.com/query/latest)

---

## 🚀 Começo Rápido

### Pré-requisitos
- Node.js (v18+)
- npm

### Instalação

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/seu-usuario/cozinha-ao-lucro.git
   cd cozinha-ao-lucro
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar Ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=sua_url_projeto
   VITE_SUPABASE_ANON_KEY=sua_anon_key
   ```

4. **Rodar Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```

---

## 🤝 Contribuindo

Por favor leia o [Guia do Desenvolvedor](docs/DEVELOPER_GUIDE.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

---

_Feito com ❤️ para empreendedores._
