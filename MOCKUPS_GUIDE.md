# Guia de Mockups - Cozinha ao Lucro 2.0

Este documento explica como criar a conta demo e capturar os screenshots para a Landing Page.

---

## 🚀 Passo 1: Criar a Conta Demo

1. Acesse `http://localhost:5173/register`
2. Crie uma conta com:
   - **Email**: `maria.doceira.demo@cozinhaaolucro.com`
   - **Senha**: `Demo@2026!`
3. Faça login na conta criada

---

## 🗄️ Passo 2: Popular com Dados

1. Abra o **Supabase Dashboard** → SQL Editor
2. Execute este comando para encontrar o `user_id`:
   ```sql
   SELECT id FROM auth.users WHERE email = 'maria.doceira.demo@cozinhaaolucro.com';
   ```
3. Copie o UUID retornado
4. Abra o arquivo `seed-maria-doceira.sql` na raiz do projeto
5. Substitua `'SEU_USER_ID_AQUI'` pelo UUID copiado
6. Execute o script completo no SQL Editor

---

## 📸 Passo 3: Capturar os Screenshots

### 1. Dashboard Desktop (`hero_dashboard_desktop.png`)
- **Navegar para**: Dashboard principal
- **O que mostrar**: 
  - Gráfico de faturamento crescente (Jan-Mai)
  - Cards: R$ 12.840 Faturamento, R$ 4.230 Lucro, 47 Pedidos
  - Meta de vendas: 85% atingida
  - Próximos pedidos à direita
- **Dica**: Use `Win + Shift + S` para capturar a área

### 2. Mobile Pedidos (`hero_mobile_pedidos.png`)
- **Navegar para**: Pedidos (em viewport mobile - F12 → Device Mode)
- **O que mostrar**:
  - Lista com pedidos de hoje
  - Status variados: Pronto (verde), Preparando (amarelo), Pendente (cinza)
- **Dica**: Reduza zoom do DevTools para 375x812

### 3. Precificação Desktop (`showcase_precificacao.png`)
- **Navegar para**: Produtos → Clique em um produto (ex: Brigadeiro Gourmet)
- **O que mostrar**:
  - Ficha técnica com ingredientes
  - Custo total calculado
  - Lucro por unidade em destaque

### 4. Lista de Compras Mobile (`showcase_compras_mobile.png`)
- **Navegar para**: Lista de Compras (viewport mobile)
- **O que mostrar**:
  - Itens organizados por categoria
  - Alguns itens marcados como comprados

### 5. Gestão de Estoque (`showcase_gestao.png`)
- **Navegar para**: Produtos → Ingredientes
- **O que mostrar**:
  - Tabela de ingredientes com quantidades
  - Algum item com alerta de estoque baixo (vermelho/amarelo)

---

## 📁 Onde Salvar

Salve os arquivos em: `public/images/mockups/`

```
public/
  images/
    mockups/
      hero_dashboard_desktop.png
      hero_mobile_pedidos.png
      showcase_precificacao.png
      showcase_compras_mobile.png
      showcase_gestao.png
```

---

## 🎨 Dicas de Qualidade

1. **Resolução**: Capture em 2x (Retina) se possível
2. **Limpo**: Feche abas/extensões desnecessárias
3. **Dados Reais**: Os dados do seed são impressionantes:
   - Faturamento: R$ 12.840/mês
   - Lucro: R$ 4.230/mês (33% margem)
   - 47 pedidos no mês
   - 8 clientes fiéis
4. **Mockup Frames**: Opcional - use Figma/Canva para adicionar frames de MacBook/iPhone

---

## ✅ Após Capturar

Me avise quando os arquivos estiverem salvos em `public/images/mockups/` e eu atualizarei as URLs nos componentes `HeroSection.tsx` e `AppShowcase.tsx`.
