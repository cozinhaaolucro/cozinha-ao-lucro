# Guia do Desenvolvedor

## Visão Geral do Projeto
**Cozinha ao Lucro** é um Progressive Web App (PWA) construído para ajudar pequenos empreendedores do ramo alimentício a gerenciar pedidos, estoque e finanças.

## Tech Stack
- **Framework**: React 18 (Vite)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Gerenciamento de Estado**: React Context + TanStack Query
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage)
- **Deploy**: Vercel

## Estrutura do Projeto

```
src/
├── components/         # Componentes de UI compartilhados
│   ├── ui/            # Componentes primitivos shadcn/ui
│   ├── orders/        # Componentes específicos de Pedidos
│   ├── products/      # Componentes específicos de Produtos
│   └── ...
├── services/          # Chamadas de API e lógica de negócios
├── contexts/          # Estado Global (Auth, Theme, etc.)
├── hooks/             # Hooks React customizados (useOrders, useStock)
├── layouts/           # Layouts de página (DashboardLayout, AuthLayout)
├── pages/             # Componentes de Página (Rotas)
├── lib/               # Utilitários (Cliente Supabase, helpers)
└── types/             # Definições de tipos TypeScript
```

## Conceitos Chave

### 1. Gerenciamento de Estado
Utilizamos uma abordagem híbrida:
- **Server State**: Gerenciado pelo `TanStack Query` (React Query). Lida com cache, estados de carregamento e invalidação de dados (pedidos, produtos, etc.).
- **Global UI State**: Gerenciado pela Context API do React (ex: `AuthContext`, `OnboardingContext`).

### 2. Roteamento
Configuração padrão com `react-router-dom`.
- **Rotas Públicas**: `/login`, `/register`, `/landing`
- **Rotas Protegidas**: `/app/*` (Envolvidas pelo `DashboardLayout`)

### 3. Banco de Dados & Tempo Real
- **Cliente Supabase**: Localizado em `src/lib/supabase.ts`.
- **Row Level Security (RLS)**: Habilitado no banco para garantir que usuários acessem apenas seus próprios dados (`user_id = auth.uid()`).

### 4. Receitas & Cálculo de Custos
A lógica de negócio central está na "Ficha Técnica".
- Custos são calculados dinamicamente com base em `ProductIngredients`.
- Alterar o custo de um Ingrediente deve disparar o recálculo de todos os Produtos que o utilizam.

## Configuração de Desenvolvimento

1. **Instalar Dependências**
   ```bash
   npm install
   ```
2. **Variáveis de Ambiente**
   Crie um arquivo `.env` com:
   ```env
   VITE_SUPABASE_URL=sua_url_projeto
   VITE_SUPABASE_ANON_KEY=sua_anon_key
   ```
3. **Rodar Servidor Local**
   ```bash
   npm run dev
   ```

## Contribuindo
- Siga as regras de linting existentes (`npm run lint`).
- Garanta que novos componentes sejam responsivos (abordagem Mobile First).
