# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o **Cozinha ao Lucro**! Este guia vai te ajudar a começar.

---

## 📋 Pré-requisitos

- Node.js 18+
- npm 9+
- Git
- Conta no Supabase (para desenvolvimento local)

---

## 🚀 Setup do Ambiente

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/cozinha-ao-lucro.git
cd cozinha-ao-lucro
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. Rode o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:8080`.

---

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes React
├── pages/          # Páginas da aplicação
├── services/       # Lógica de negócio
├── hooks/          # Custom hooks
├── lib/            # Utilities e configs
├── contexts/       # React contexts
├── types/          # TypeScript types
└── test/           # Setup de testes
```

---

## 🧪 Testes

### Rodar Testes

```bash
# Rodar uma vez
npm test

# Watch mode
npm run test:watch

# Com UI
npm run test:ui

# Com coverage
npm run test:coverage
```

### Escrever Testes

- Coloque testes em `__tests__` dentro do diretório relevante
- Use `.test.ts` ou `.spec.ts` como extensão
- Siga o padrão AAA (Arrange, Act, Assert)

```typescript
// src/services/__tests__/example.test.ts
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

---

## 📝 Convenções de Código

### TypeScript

- Use tipos explícitos para parâmetros e retornos de funções
- Evite `any` sempre que possível
- Use interfaces para objetos complexos

```typescript
// ✅ Bom
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

// ❌ Evite
function calculateTotal(items: any): any {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}
```

### Componentes React

- Use function components com hooks
- Extraia lógica complexa para custom hooks
- Mantenha componentes focados (single responsibility)

```tsx
// ✅ Bom - lógica extraída para hook
function Dashboard() {
  const { metrics, isLoading } = useDashboardMetrics();
  
  if (isLoading) return <Skeleton />;
  return <MetricsDisplay metrics={metrics} />;
}

// ❌ Evite - componente com muita lógica
function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  // ... 200 linhas de lógica
  return <div>...</div>;
}
```

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: adiciona filtro por período no dashboard"

# Bug fixes
git commit -m "fix: corrige cálculo de estoque duplicado"

# Refactoring
git commit -m "refactor: extrai lógica de métricas para service"

# Docs
git commit -m "docs: atualiza README com instruções de deploy"

# Tests
git commit -m "test: adiciona testes para AnalyticsService"

# Chore
git commit -m "chore: atualiza dependências"
```

---

## 🔀 Workflow de Contribuição

### 1. Crie uma Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 2. Faça suas Alterações

- Siga as convenções de código
- Adicione testes quando aplicável
- Mantenha commits pequenos e focados

### 3. Rode os Testes

```bash
npm test
npm run lint
```

### 4. Faça Push

```bash
git push origin feature/minha-feature
```

### 5. Abra um Pull Request

- Use um título descritivo
- Preencha o template de PR
- Link issues relacionadas

---

## 🐛 Reportando Bugs

Ao reportar um bug, inclua:

1. **Descrição clara** do problema
2. **Passos para reproduzir**
3. **Comportamento esperado** vs **Comportamento atual**
4. **Screenshots** (se aplicável)
5. **Ambiente** (browser, OS, versão do app)

---

## 💡 Sugerindo Features

Antes de sugerir uma feature:

1. Verifique se já não existe uma issue similar
2. Descreva o problema que a feature resolve
3. Proponha uma solução (opcional)
4. Considere o impacto no usuário final

---

## 📊 Database

### Migrations

Migrations ficam em `supabase/migrations/`:

```sql
-- supabase/migrations/20260113_my_migration.sql
ALTER TABLE products ADD COLUMN new_field text;
```

### Schema

O schema completo está em `supabase/SCHEMA_COMPLETO.sql`.

---

## 🔐 Segurança

- **Nunca** comite credenciais ou secrets
- Use RLS policies para proteção de dados
- Valide inputs no frontend E backend
- Reporte vulnerabilidades de forma privada

---

## 📚 Recursos

- [Documentação de Arquitetura](./docs/ARCHITECTURE.md)
- [Documentação da API](./docs/API.md)
- [Schema do Banco](./supabase/SCHEMA_COMPLETO.sql)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)

---

## ❓ Dúvidas?

- Abra uma issue com a tag `question`
- Entre em contato: cozinhaaolucro@gmail.com

---

Obrigado por contribuir! 🎉
