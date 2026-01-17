# Sistema de Design - Cozinha ao Lucro

Este documento define as **diretrizes visuais estritas** para o rebrand do aplicativo "Cozinha ao Lucro" (2026). Serve como a única fonte da verdade para designers e desenvolvedores manterem uma UI premium, consistente e escalável.

---

## 1. Paleta de Cores

O aplicativo utiliza uma paleta de cores HSL refinada. Todas as cores devem ser referenciadas via variáveis CSS.

### Cores Primárias
| Função | Nome da Cor | Valor HSL | Aprox. Hex | Var CSS | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primária** | Azul Escuro | `186° 35% 28%` | `#2E6065` | `--primary` | Botões principais, títulos, estados ativos |
| **Secundária** | Azul Claro | `187° 29% 58%` | `#75B3B8` | `--secondary` | Acentos, botões secundários, destaques |
| **Acento** | Ciano Mudo | `182° 16% 55%` | `#789A9C` | `--accent` | Destaques da sidebar, anéis, UI sutil |

### Cores Funcionais
| Função | Nome da Cor | Valor HSL | Aprox. Hex | Var CSS | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Financeiro** | Dourado | `41° 53% 55%` | `#C6A74F` | `--financial` | Receita, lucro, recursos premium |
| **Destrutivo** | Vermelho | `8° 48% 58%` | `#D66050` | `--destructive` | Erros, ações de exclusão, atrasados |
| **Sucesso** | Verde | `168° 22% 52%` | `#60B38B` | `--success` | Mensagens de sucesso, estoque OK |
| **Aviso** | Âmbar | `41° 53% 55%` | `#C6A74F` | `--warning` | Avisos, alertas de estoque baixo |
| **Info** | Azul/Laranja| `24° 58% 56%` | `#E09259` | `--info` | Mensagens informativas |

### Neutros & Fundos
| Função | Nome da Cor | Valor HSL | Aprox. Hex | Var CSS | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fundo** | Off-White | `200° 5% 98%` | `#F8F9FA` | `--background` | Fundo principal do app |
| **Primeiro Plano** | Cinza Escuro | `210° 9% 32%` | `#4B5259` | `--foreground` | Corpo de texto principal |
| **Card** | Branco Card | `200° 5% 99%` | `#FAFBFC` | `--card` | Superfícies de cartões |
| **Mudo** | Cinza Frio | `200° 5% 90%` | `#E5E7EB` | `--muted` | Estados desabilitados, esqueletos |
| **Borda** | Cinza Claro | `200° 5% 85%` | `#D9DCDF` | `--border` | Bordas de input, separadores |

### Especificidades da Sidebar
| Função | Valor HSL | Var CSS |
| :--- | :--- | :--- |
| **Fundo** | `60° 5% 96%` | `--sidebar-background` |
| **Primeiro Plano**| `210° 9% 32%` | `--sidebar-foreground` |
| **Primária** | `186° 35% 28%` | `--sidebar-primary` |

### Cores de Status do Pedido
| Status | Função | Base HSL | Fundo HSL | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Pendente** | A Fazer | `41° 53% 55%` | `41° 53% 92%` | Pedidos aguardando início |
| **Preparando** | Em Produção | `200° 48% 60%` | `200° 48% 94%` | Pedidos sendo feitos |
| **Pronto** | Pronto | `155° 35% 46%` | `155° 35% 92%` | Produção concluída |
| **Entregue** | Entregue | `220° 10% 45%` | `220° 10% 96%` | Vendas finalizadas |
| **Atrasado** | Atrasado | `8° 48% 58%` | `8° 48% 92%` | Passou da data de vencimento |

### Visualização de Dados (Gráficos)
- **Receita**: `--success` ou `--primary`
- **Custo**: `--destructive`
- **Lucro**: `--primary` ou `--financial`
- **Linhas de Grade**: `stroke="#E5E7EB"` (Gray 200)
- **Tooltip**: `bg-card border-border shadow-lg`

---

## 2. Tipografia

**Família da Fonte**: `Plus Jakarta Sans`, system-ui, sans-serif.

| Peso | Valor | Uso |
| :--- | :--- | :--- |
| **Regular** | 400 | Texto do corpo, descrições |
| **Médio** | 500 | Elementos interativos, rótulos, dados de tabela |
| **SemiNegrito** | 600 | Subtítulos, botões, ênfase forte |
| **Negrito** | 700 | Títulos principais (`h1`, `h2`), métricas chave |
| **ExtraNegrito** | 800 | Métricas de display, texto hero grande |

**Configurações Globais**:
- Tamanho da fonte `root`: `13px` (Efetivamente um "zoom out" de ~25% para maior densidade de informação).
- Altura da linha: `1.6` [Corpo], `1.25` [Títulos].
- Espaçamento entre letras: `-0.02em` [Títulos], `normal` [Corpo].

**Gradientes de Texto**:
- **`.text-gradient-gold`**: Gradiente linear de `#B8860B` via `#FFD700` para `#B8860B`. Usado para recursos premium.
- **`.text-gradient-primary`**: Gradiente linear de tons primários.

---

## 3. Componentes de UI e Elementos Interativos

### Botões (`.btn-primary`)
- **Base**: `bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl`
- **Sombra**: `shadow-elegant` (`0 4px 12px hsla(210, 15%, 20%, 0.1)`)
- **Hover**: `brightness-110`, `translate-y-[-2px]`, sombra aumentada.
- **Ativo**: `scale-98`, `translate-y-0`.

### Cards & Glassmorfismo
- **Card Padrão**: `bg-card border border-border/60 shadow-elegant rounded-xl`.
- **`.glass-panel`**: `bg-white/90 backdrop-blur-xl border-white/60 shadow-card`.
- **`.premium-card`**: `bg-card border-white/50 shadow-elegant` com sobreposição de gradiente interno.

### Inputs & Formulários
- **Borda**: `--input` (`hsl(200 5% 85%)`).
- **Raio**: `0.75rem` (12px).
- **Estado de Foco**: `border-ring` (`hsl(182 16% 55%)`) + Brilho do Anel: `0 0 0 3px rgba(100, 137, 138, 0.2)`.
- **Placeholder**: `text-muted-foreground`.

### Badges & Tags
- **Padrão**: `bg-secondary/10 text-secondary border-transparent`.
- **Outline (Contorno)**: `border-border text-foreground bg-transparent`.
- **Badges de Status**: Usar Fundos de Status e cores Base específicas (ex: `bg-status-ready-bg text-status-ready-base`).

### Calendários & Seletores de Data
Componentes de seleção de data (baseados em `react-day-picker`) devem ser estritamente estilizados.
- **Data Selecionada**: `bg-primary` texto `white` arredondamento `md`.
- **Meio do Intervalo**: `bg-primary/10` ou `bg-accent/20`.
- **Hoje**: Texto em negrito `text-primary`.
- **Hover**: `bg-muted` arredondamento `md`.
- **Ícones de Navegação**: Cor `--icon-color`, hover para `primary`.

### Estados de Hover (Geral)
Elementos interativos devem fornecer feedback visual imediato.
- **Elementos de Ação**: Transformação `translate-y-[-2px]` e iluminar.
- **Itens de Lista**: `hover:bg-muted/30` ou `hover:bg-primary/5`.
- **Cartões**: Levantar `translate-y-[-4px]` e mudança de cor da borda para `primary/20`.

---

## 4. Layout & Espaçamento

### Breakpoints
- **Mobile**: `< 768px` (Layouts empilhados, usar Drawer ao invés de Dialog frequentemente).
- **Tablet**: `768px - 1024px`.
- **Desktop**: `> 1024px`.
- **Container Max**: `1400px` (`.container-max`).

### Escala de Espaçamento
- **Padding de Seção**: `py-24 px-4` (Espaçamento generoso para sensação premium).
- **Padrões de Gap**: `gap-4` (16px) para grids, `gap-2` (8px) para elementos próximos.

---

## 5. Iconografia

**Biblioteca**: `lucide-react`.
**Traço Padrão**: `2px` (Peso médio).
**Cores**:
- Padrão: `--icon-color` (`hsl(58 2% 54%)`).
- Ativo/Primário: `--primary`.
- Funcional: Corresponder à cor funcional (ex: Vermelho para ícones de lixeira).

---

## 6. Efeitos, Utilitários & Animações

### Sombras
- **Elegante**: `--shadow-elegant` (Suave, espalhada).
- **Hover**: `--shadow-hover` (Mais forte, indica elevação).
- **Card**: `--shadow-card` (Profundidade sutil).

### Efeitos de Fundo
- **Corpo Principal**: `radial-gradient` spots em 15% e 85% usando `primary` com 2-3% opacidade.
- **`.bg-noise`**: Filtro SVG de ruído com opacidade 0.05 para textura.

### Barras de Rolagem (`.custom-scrollbar`)
- **Largura**: `4px` (Fina).
- **Trilha**: `rgba(0,0,0,0.05)`.
- **Polegar (Thumb)**: `rgba(0,0,0,0.2)` arredondado.

### Animações
| Nome | Descrição | Classe |
| :--- | :--- | :--- |
| **Shimmer** | Efeito de onda em esqueleto de carregamento | `.animate-shimmer` |
| **Shine (Brilho)** | Brilho de luz diagonal | `.effect-shine` |
| **Float (Flutuar)** | Flutuação vertical suave | `.animate-float` |
| **Subtle Pulse** | Respiração de opacidade | `.animate-subtle-pulse` |

### Otimizações Técnicas (Correção de Jitter)
Todos os elementos interativos/transformadores DEVEM usar:
```css
transform: translate3d(0, 0, 0);
backface-visibility: hidden;
perspective: 1000px;
```
Isso força a renderização via GPU para prevenir desfoque/trepidação de sub-pixel durante animações.
