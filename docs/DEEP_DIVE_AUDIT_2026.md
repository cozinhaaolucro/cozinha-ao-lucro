# Auditoria Técnica "Deep Dive" 2026 - Cozinha ao Lucro

**Data:** 24/01/2026
**Responsável:** Antigravity Agent (Deepmind)
**Status:** Crítico / Informativo

---

## 1. Integridade da Lógica de Negócio (Business Logic)

### 🚨 Duplicação Crítica de Lógica (DRY Violation)
Foi identificado um risco severo na consistência dos dados de estoque.
*   **O Problema:** A lógica de "Verificar se há estoque suficiente" existe em dois lugares diferentes e desconectados:
    1.  `src/hooks/useOrderOperations.ts` (Usado para duplicar pedidos).
    2.  `src/components/orders/NewOrderDialog.tsx` (Usado para criar novos pedidos).
    3.  *(Provável)* `EditOrderDialog.tsx`.
*   **O Risco:** Se você alterar a regra de como o "estoque reservado" é calculado em um lugar (ex: considerar margem de segurança), o outro lugar continuará usando a regra antiga. Isso pode levar a **furos de estoque** silenciosos.
*   **Recomendação:** Centralizar imediatamente essa regra em um hook `useStockAvailability(items)` ou função de serviço `validateStock(items)`.

### 🧬 Lista Inteligente (SmartList.tsx)
*   **Análise:** O algoritmo atual assume que a relação `ingredient` sempre existe dentro de `product_ingredients`.
*   **Fragilidade:** Depende de o Supabase retornar a relação aninhada (`select('*, product_ingredients(..., ingredient(*))')`). Se a query mudar levemente, a lista quebra.
*   **UX:** O componente `SwipeButton` força a compra de *toda* a quantidade faltante. Não permite ajuste fino (ex: faltam 200g, mas o pacote é de 1kg, ou quero comprar só 100g agora).

---

## 2. Arquitetura Frontend & Manutenibilidade

### 🏗️ O Monolito `Dashboard.tsx`
*   **Diagnóstico:** O arquivo possui **668 linhas**. Ele mistura:
    *   Lógica de busca de dados (Hooks).
    *   Lógica de transformação de dados (`dailyData`, `topProfitableProducts`).
    *   Lógica de apresentação (Cards, Gráficos Recharts).
*   **Impacto:** Qualquer alteração pequena (ex: mudar a cor de um gráfico) exige recompilar e "tocar" no arquivo inteiro, aumentando a chance de quebrar a lógica de cálculo por acidente.
*   **Recomendação:** Extrair componentes menores:
    *   `src/components/dashboard/RevenueMetrics.tsx`
    *   `src/components/dashboard/SalesChart.tsx`
    *   `src/components/dashboard/TopProductsList.tsx`

### 📋 Gestão de Formulários (Dialogs)
*   **Diagnóstico:** O `NewOrderDialog.tsx` gerencia um formulário complexo usando múltiplos `useState` manuais (`formData`, `items`, `newCustomerData`).
*   **Problema:**
    *   Não há validação robusta (ex: impedir taxas de entrega negativas).
    *   O código de manipulação de arrays (`items.map`, `items.filter`) é verboso e propenso a erros.
*   **Recomendação:** Adotar **React Hook Form** + **Zod**. Isso reduziria o código do componente em ~40% e garantiria validação automática de tipos e regras de negócio.

---

## 3. Resiliência e Performance

### 🛡️ Tratamento de Erros
*   O sistema confia muito no `console.error` seguido de um `toast`. Embora funcional para o usuário, isso não nos dá visibilidade.
*   **Falta:** Não há um `ErrorBoundary` global visível nas páginas principais. Se o componente `SmartList` falhar (erro de cálculo), a tela inteira do App pode ficar branca (White Screen of Death).

### ⚡ Performance de Renderização
*   O Dashboard recalcula `topProfitableProducts` a cada renderização. Embora use `useMemo`, a lista de depedências inclui `orders`. Como `orders` muda frequentemente (polling ou realtime), o custo de CPU para reordenar arrays grandes no navegador pode causar "travadinhas" em celulares mais fracos (Cenário típico: Tablet Samsung Tab A em cozinha).

---

## 4. Plano de Ação Recomendado (Priorizado)

### Imediato (Alta Criticidade)
1.  **Refatorar Validação de Estoque:** Criar `src/hooks/useStockCheck.ts` e remover a lógica duplicada de `NewOrderDialog` e `useOrderOperations`.

### Curto Prazo (Qualidade de Vida)
2.  **Atomizar Dashboard:** Quebrar o arquivo gigante em 3-4 subcomponentes.
3.  **Adotar Zod:** Migrar o formulário de `NewOrderDialog` para React Hook Form (reduz bugs de input).

### Longo Prazo (Evolução)
4.  **SmartList V2:** Permitir edição manual das quantidades a comprar antes de confirmar o `Swipe`.

---

*Relatório de Auditoria Profunda - Gerado por Agente Antigravity.*
