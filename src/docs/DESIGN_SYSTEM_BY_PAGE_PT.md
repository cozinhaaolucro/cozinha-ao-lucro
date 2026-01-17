# Sistema de Design Organizado por Página - Cozinha ao Lucro

Este documento é a **referência técnica e visual definitiva** para o rebrand e manutenção do aplicativo "Cozinha ao Lucro" (2026). Ele organiza as regras por página, garantindo que cada componente tenha suas especificações de cor (HSL/Variáveis), tipografia e comportamento explicitadas com suporte visual.

---

## 1. Diretrizes Globais (Fundação Técnica)

Estas regras se aplicam a todo o sistema e devem ser a base de qualquer desenvolvimento.

### 1.1. Paleta de Cores Mestra
Todas as cores **DEVEM** ser utilizadas via variáveis CSS definidas no `index.css`.

| Função | Nome | Variável CSS | Cor Visual (Valor) |
| :--- | :--- | :--- | :--- |
| **Primária** | Azul Escuro | `--primary` | `hsl(186 35% 28%)` |
| **Secundária** | Azul Claro | `--secondary` | `hsl(187 29% 58%)` |
| **Acento** | Ciano Mudo | `--accent` | `hsl(182 16% 55%)` |
| **Financeiro** | Dourado | `--financial` | `hsl(41 53% 55%)` |
| **Destrutivo** | Vermelho | `--destructive` | `hsl(8 48% 58%)` |
| **Sucesso** | Verde | `--success` | `hsl(168 22% 52%)` |
| **Aviso** | Âmbar | `--warning` | `hsl(41 53% 55%)` |
| **Fundo App** | Off-White | `--background` | `hsl(200 5% 98%)` |
| **Texto Base** | Cinza Escuro | `--foreground` | `hsl(210 9% 32%)` |
| **Borda** | Cinza Claro | `--border` | `hsl(200 5% 85%)` |
| **Input** | Cinza Claro | `--input` | `hsl(200 5% 85%)` |
| **Muted** | Cinza Frio | `--muted` | `hsl(200 5% 90%)` |

### 1.2. Tipografia Global
**Fonte:** `Plus Jakarta Sans`.
- **H1:** Bold (700), Tamanho `2xl` ou `3xl`, Cor `--foreground` (`hsl(210 9% 32%)`).
- **H2/H3:** Bold (600/700), Cor `--foreground` (`hsl(210 9% 32%)`).
- **Corpo:** Regular (400), Cor `--foreground` (`hsl(210 9% 32%)`) ou `--muted-foreground` (`hsl(200 3% 50%)`).
- **Legibilidade:** `root font-size: 13px`.

### 1.3. Efeitos e Sombras
- **Sombra Elevada:** `--shadow-elegant` (`hsla(210 15% 20% / 0.1)`).
- **Sombra Hover:** `--shadow-hover` (`hsla(210 15% 20% / 0.14)`).
- **Correção de Jitter:** `transform: translate3d(0,0,0); backface-visibility: hidden;` em containers animados.

---

## 2. Detalhamento Técnico por Página

### 2.1. Dashboard (Visão Geral)
A tela de análise principal.

*   **Fundo da Página:** `--background` (`hsl(200 5% 98%)`) com gradientes radiais laterais usando `--primary` (`hsl(186 35% 28%)`) a 3% opacidade.
*   **Cabeçalho e Filtros:**
    *   **Título:** "Visão Geral", Bold, `--foreground` (`hsl(210 9% 32%)`).
    *   **Date Range Picker:**
        *   Input: Borda `--input` (`hsl(200 5% 85%)`), Fundo branco (`#ffffff`).
        *   Popover: Fundo branco (`#ffffff`), Sombra `--shadow-elegant`.
        *   **Seleção:** Início/Fim com fundo `--primary` (`hsl(186 35% 28%)`) e Texto Branco (`#ffffff`). Intervalo com fundo `--accent` (`hsl(182 16% 55%)`) a 20% (`bg-accent/20`).
*   **Card: Meta de Vendas (Premium):**
    *   **Estilo:** `.premium-card` (Borda interna sutil, fundo `bg-card`).
    *   **Ícone:** Cor `--primary` (`hsl(186 35% 28%)`). Container `bg-primary/5`.
    *   **Progresso:** Barra com gradiente linear `to-r` de `--primary` (`hsl(186 35% 28%)`) para `--secondary` (`hsl(187 29% 58%)`).
    *   **Texto de Valor:** ExtraBold, `--foreground` (`hsl(210 9% 32%)`).
*   **Cards Financeiros (KPIs):**
    *   **Estilo:** `.glass-card` (Branco `#ffffff` com 60% opacidade, blur).
    *   **Ícones:**
        *   Receita: Cor `--primary` (`hsl(186 35% 28%)`), Fundo `bg-primary/10`.
        *   Lucro: Cor `--financial` (`hsl(41 53% 55%)`), Fundo `bg-financial/10`.
        *   Custo: Cor `--destructive` (`hsl(8 48% 58%)`), Fundo `bg-destructive/10`.
*   **Card: Estoque vs Demanda:**
    *   **Lista Unificada:**
        *   **Itens (Geral):** Borda inferior `--border` (`hsl(200 5% 85%)`) com 40% opacidade. Hover `bg-muted` (`hsl(200 5% 90%)`) a 30%.
        *   **Item Crítico:**
            *   Ícone: `XCircle` na cor `--destructive` (`hsl(8 48% 58%)`).
            *   Badge: Fundo `destructive/10`, Texto `--destructive` (`hsl(8 48% 58%)`).
            *   *NUNCA* usar borda vermelha ao redor do item inteiro.
        *   **Item Ok:**
            *   Ícone: `CheckCircle` na cor `--success` (`hsl(168 22% 52%)`).
            *   Badge: Fundo `success/10`, Texto `--success` (`hsl(168 22% 52%)`).
        *   **Item Baixo:**
            *   Ícone: `AlertCircle` na cor `--warning` (`hsl(41 53% 55%)`).
            *   Badge: Fundo `warning/10`, Texto `--warning` (`hsl(41 53% 55%)`).

### 2.2. Pedidos (Gestão e Kanban)
Fluxo operacional.

*   **Ações Principais:**
    *   **Botão Novo Pedido:** `.btn-primary` (Fundo `--primary` `hsl(186 35% 28%)`, Sombra `--shadow-elegant`).
    *   **Filtros de Status:** Botões `outline`. Quando ativo, assume a cor do status correspondente (ex: fundo `warning/10` para Pendente).
*   **Kanban Board:**
    *   **Coluna "A Fazer":** Header Badge e Cor Base: `--warning` (`hsl(41 53% 55%)`). Fundo Header: `hsl(41 53% 92%)`.
    *   **Coluna "Em Produção":** Header Badge e Cor Base: `--primary` (Light: `hsl(200 48% 60%)`). Fundo Header: `hsl(200 48% 94%)`.
    *   **Coluna "Pronto":** Header Badge e Cor Base: `--success` (`hsl(155 35% 46%)`). Fundo Header: `hsl(155 35% 92%)`.
    *   **Coluna "Entregue":** Header Badge e Cor Base: Neutro (`hsl(220 10% 45%)`). Fundo Header: `hsl(220 10% 96%)`.
*   **Cards de Pedido:**
    *   **Container:** Branco Puro (`#ffffff`), Borda `--border` (`hsl(200 5% 85%)`), Sombra `--shadow-card`.
    *   **Hover:** `translate-y-[-2px]`, Sombra cresce.
    *   **Indicador de Atraso:** Borda esquerda sólida `4px` na cor `--destructive` (`hsl(8 48% 58%)`). Ícone de relógio `--destructive` (`hsl(8 48% 58%)`) animado.

### 2.3. Produtos e Ingredientes
Catálogo.

*   **Navegação (Abas):**
    *   **Lista de Abas:** Fundo `--muted` (`hsl(200 5% 90%)`).
    *   **Gatilho Ativo:** Fundo Branco (`#ffffff`), Texto `--foreground` (`hsl(210 9% 32%)`), Sombra `sm`.
*   **Lista de Produtos:**
    *   **Card:** Borda `--border` (`hsl(200 5% 85%)`). Imagem com `rounded-md`.
    *   **Badge de Lucro:**
        *   >50% (Alto): Fundo `success/10`, Texto `--success` (`hsl(168 22% 52%)`).
        *   <30% (Baixo): Fundo `warning/10`, Texto `--warning` (`hsl(41 53% 55%)`) ou `--destructive`.
*   **Lista de Ingredientes:**
    *   **Grid:** Cards compactos.
    *   **Ícones:** **SEMPRE** `--primary` (`hsl(186 35% 28%)`). Não alterar cor do ícone baseada em status.
    *   **Status de Estoque:** Apenas o *texto* do valor muda de cor (`--success`, `--warning`, `--destructive`).
    *   **Ações Rápidas:** Botões 'ghost' invisíveis até o hover, cor `--muted-foreground` (`hsl(200 3% 50%)`) hover `--foreground`.

### 2.4. Clientes (CRM)
Dados tabulares.

*   **Tabela:**
    *   **Cabeçalho:** Fundo transparente, Texto `--muted-foreground` (`hsl(200 3% 50%)`), Uppercase, `text-xs`.
    *   **Linhas:** Alternância opcional. Hover obrigatório: `bg-primary/5`.
    *   **Avatar:** Círculo `bg-primary/10`, Iniciais `text-primary` (`hsl(186 35% 28%)`).
*   **Status do Cliente:**
    *   Novo: Badge Azul `--secondary` (`hsl(187 29% 58%)`).
    *   Fiel: Badge Dourada `--financial` (`hsl(41 53% 55%)`).
    *   Inativo: Badge Cinza `--muted-foreground` (`hsl(200 3% 50%)`).

### 2.5. Lista de Compras
Checklist.

*   **Container:** `.glass-panel` ou fundo branco limpo (`#ffffff`).
*   **Item:**
    *   **Checkbox:**
        *   Vazio: Borda `--input` (`hsl(200 5% 85%)`).
        *   Marcado: Fundo `--primary` (`hsl(186 35% 28%)`), Borda `--primary`.
    *   **Texto:**
        *   Normal: `--foreground` (`hsl(210 9% 32%)`).
        *   Marcado: `line-through`, `--muted-foreground` (`hsl(200 3% 50%)`) (opacidade 0.5).

### 2.6. Login e Registro
Páginas Públicas.

*   **Background:** Textura `.bg-noise` sobre `--background` (`hsl(200 5% 98%)`) ou padrão geométrico sutil com `--primary` (`hsl(186 35% 28%)`) a 2% opacidade.
*   **Card Central:**
    *   Classe: `.glass-panel` (Fundo branco/90 com blur).
    *   Sombra: `shadow-2xl` (mais forte que o app interno).
*   **Inputs:**
    *   Altura: `h-11` (mais altos para toque fácil).
    *   Foco: Anel `--ring` (`hsl(182 16% 55%)`).
*   **Botão Principal:**
    *   Largura: `w-full`.
    *   Animação: `.effect-shine` no hover.

---

## 3. Micro-interações e Feedback

### 3.1. Toasts (Notificações)
Usar componente `Sonner` ou `Toast` padrão.
*   **Sucesso:** Fundo Branco, Borda `--success` (`hsl(168 22% 52%)`), Ícone `--success`.
*   **Erro:** Fundo Branco, Borda `--destructive` (`hsl(8 48% 58%)`), Ícone `--destructive`.
*   **Info:** Fundo Branco, Borda `--secondary` (`hsl(187 29% 58%)`), Ícone `--secondary`.

### 3.2. Loading States
*   **Skeleton:** Animação `.animate-shimmer`. Cor base `--muted` (`hsl(200 5% 90%)`).
*   **Spinner:** Cor `--primary` (`hsl(186 35% 28%)`).

### 3.3. Botões e Links
*   **Links:** Texto `--primary` (`hsl(186 35% 28%)`), hover `underline`.
*   **Botões Ghost:** Texto `--muted-foreground` (`hsl(200 3% 50%)`), hover `--foreground` e `bg-muted/50`.
*   **Botões Destrutivos:** Texto `--destructive` (`hsl(8 48% 58%)`), hover `bg-destructive/10`.
