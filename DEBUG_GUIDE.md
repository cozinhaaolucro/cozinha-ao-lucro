# Guia de Debug - Criação de Ingredientes/Produtos

## Passo a Passo para Identificar o Problema

### 1. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I` (Windows)
- Vá na aba **Console**

### 2. Tente Criar um Ingrediente
- Vá em **Produtos** > Aba **Ingredientes**
- Clique em "Novo Ingrediente"
- Preencha:
  - Nome: "Leite Condensado"
  - Unidade: "unidade"
  - Custo: 5.50
- Clique em "Criar"

### 3. Verifique o Console
Procure por erros em vermelho. Os erros mais comuns são:

#### Erro A: "permission denied for table ingredients"
**Causa**: As políticas RLS não permitem inserção
**Solução**: Execute no Supabase SQL Editor:
```sql
-- Verifique o user_id
SELECT id, email FROM auth.users;

-- Teste se existe profile  
SELECT * FROM profiles WHERE id = 'SEU_USER_ID_AQUI';

-- Se não existir, crie:
INSERT INTO profiles (id, business_name) 
VALUES ('SEU_USER_ID_AQUI', 'Meu Negócio');
```

#### Erro B: "relation public.ingredients does not exist"
**Causa**: Tabelas não foram criadas
**Solução**: Execute novamente a migração completa em:
`supabase/migrations/20250125_initial_schema.sql`

#### Erro C: "null value in column user_id violates not-null constraint"
**Causa**: Usuário não está autenticado ou getUser() retornou null
**Solução**: 
1. Faça logout e login novamente
2. Verifique se está usando `cozinhaaolucro@gmail.com`

### 4. Verifique a Autenticação
No console, digite:
```javascript
// Verifique se está autenticado
const { data } = await window.supabase.auth.getUser();
console.log('User:', data.user);
```

Se `data.user` for `null`, você não está autenticado.

### 5. Teste Direto no Supabase
- Vá no Supabase Dashboard > Table Editor
- Tente inserir manualmente em `ingredients`:
  - `user_id`: (seu user ID)
  - `name`: "Teste"
  - `unit`: "kg"
  - `cost_per_unit`: 10.00

Se funcionar manualmente mas não pela app, o problema é de RLS ou código.

## Código de Debug Temporário

Adicione temporariamente no início de `createIngredient`:

```typescript
export const createIngredient = async (ingredient: ...) => {
    const user = (await supabase.auth.getUser()).data.user;
    
    // DEBUG
    console.log('User attempting to create ingredient:', user?.id, user?.email);
    console.log('Ingredient data:', ingredient);
    
    if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
    }
    
    // ... rest of code
};
```

## Me envie a resposta
Depois de tentar criar um ingrediente, me envie:
1. A mensagem de erro que apareceu (toast vermelho ou console)
2. O resultado do `console.log` do user
3. Se conseguiu inserir manualmente no Table Editor
