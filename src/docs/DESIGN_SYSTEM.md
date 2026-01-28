# Design System - Cozinha ao Lucro

This document defines the **strict visual guidelines** for the "Cozinha ao Lucro" application rebrand (2026). It serves as the single source of truth for designers and developers to maintain a premium, consistent, and scalable UI.

---

## 1. Color Palette

The application uses a refined HSL color palette. All colors should be referenced via CSS variables.

### Primary Colors
| Role | Color Name | HSL Value | Hex Approx. | CSS Var | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary** | Dark Blue | `186° 35% 28%` | `#2E6065` | `--primary` | Main buttons, headings, active states |
| **Secondary** | Light Blue | `187° 29% 58%` | `#75B3B8` | `--secondary` | Accents, secondary buttons, highlights |
| **Accent** | Muted Cyan | `182° 16% 55%` | `#789A9C` | `--accent` | Sidebar highlights, rings, subtle UI |

### Functional Colors
| Role | Color Name | HSL Value | Hex Approx. | CSS Var | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Financial** | Gold | `41° 53% 55%` | `#C6A74F` | `--financial` | Revenue, profit, premium features |
| **Destructive** | Red | `8° 48% 58%` | `#D66050` | `--destructive` | Errors, delete actions, late status |
| **Success** | Green | `168° 22% 52%` | `#60B38B` | `--success` | Success messages, stock OK |
| **Warning** | Amber | `41° 53% 55%` | `#C6A74F` | `--warning` | Warnings, low stock alerts |
| **Info** | Blue/Orange | `24° 58% 56%` | `#E09259` | `--info` | Informational messages |

### Neutrals & Backgrounds
| Role | Color Name | HSL Value | Hex Approx. | CSS Var | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Background** | Off-White | `200° 5% 98%` | `#F8F9FA` | `--background` | Main app background |
| **Foreground** | Dark Grey | `210° 9% 32%` | `#4B5259` | `--foreground` | Main text body |
| **Card** | Card White | `200° 5% 99%` | `#FAFBFC` | `--card` | Card surfaces |
| **Muted** | Cool Gray | `200° 5% 90%` | `#E5E7EB` | `--muted` | Disabled states, skeletons |
| **Border** | Light Gray | `200° 5% 85%` | `#D9DCDF` | `--border` | Input borders, separators |

### Sidebar Specifics
| Role | HSL Value | CSS Var |
| :--- | :--- | :--- |
| **Background** | `60° 5% 96%` | `--sidebar-background` |
| **Foreground** | `210° 9% 32%` | `--sidebar-foreground` |
| **Primary** | `186° 35% 28%` | `--sidebar-primary` |

### Order Status Colors
| Status | Role | HSL Base | HSL Background | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Pending** | A Fazer | `41° 53% 55%` | `41° 53% 92%` | Orders waiting to start |
| **Preparing** | Em Produção | `200° 48% 60%` | `200° 48% 94%` | Orders being made |
| **Ready** | Pronto | `155° 35% 46%` | `155° 35% 92%` | Completed production |
| **Delivered** | Entregue | `220° 10% 45%` | `220° 10% 96%` | Finalized sales |
| **Late** | Atrasado | `8° 48% 58%` | `8° 48% 92%` | Past due date |

### Data Visualization (Charts)
- **Revenue**: `--success` or `--primary`
- **Cost**: `--destructive`
- **Profit**: `--primary` or `--financial`
- **Grid Lines**: `stroke="#E5E7EB"` (Gray 200)
- **Tooltip**: `bg-card border-border shadow-lg`

---

## 2. Typography

**Font Family**: `Plus Jakarta Sans`, system-ui, sans-serif.

| Weight | Value | Usage |
| :--- | :--- | :--- |
| **Regular** | 400 | Body text, descriptions |
| **Medium** | 500 | Interactive elements, labels, table data |
| **SemiBold** | 600 | Subheadings, buttons, strong emphasis |
| **Bold** | 700 | Main headings (`h1`, `h2`), key metrics |
| **ExtraBold** | 800 | Display metrics, large hero text |

**Global Settings**:
- `root` font-size: `13px` (Effectively a ~25% zoom out for denser information).
- Line-height: `1.6` [Body], `1.25` [Headings].
- Letter-spacing: `-0.02em` [Headings], `normal` [Body].

**Text Gradients**:
- **`.text-gradient-gold`**: Linear gradient from `#B8860B` via `#FFD700` to `#B8860B`. Used for premium features.
- **`.text-gradient-primary`**: Linear gradient of primary tones.

---

## 3. UI Components & Interactive Elements

### Buttons (`.btn-primary`)
- **Base**: `bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl`
- **Shadow**: `shadow-elegant` (`0 4px 12px hsla(210, 15%, 20%, 0.1)`)
- **Hover**: `brightness-110`, `translate-y-[-2px]`, increased shadow.
- **Active**: `scale-98`, `translate-y-0`.

### Cards & Glassmorphism
- **Standard Card**: `bg-card border border-border/60 shadow-elegant rounded-xl`.
- **`.glass-panel`**: `bg-white/90 backdrop-blur-xl border-white/60 shadow-card`.
- **`.premium-card`**: `bg-card border-white/50 shadow-elegant` with internal gradient overlay.

### Inputs & Forms
- **Border**: `--input` (`hsl(200 5% 85%)`).
- **Radius**: `0.75rem` (12px).
- **Focus State**: `border-ring` (`hsl(182 16% 55%)`) + Ring Glow: `0 0 0 3px rgba(100, 137, 138, 0.2)`.
- **Placeholder**: `text-muted-foreground`.

### Badges & Tags
- **Standard**: `bg-secondary/10 text-secondary border-transparent`.
- **Outline**: `border-border text-foreground bg-transparent`.
- **Status Badges**: Use specific Status Backgrounds and Base colors (e.g., `bg-status-ready-bg text-status-ready-base`).

### Calendars & Date Pickers
Date selection components (based on `react-day-picker`) must be strictly styled.
- **Selected Date**: `bg-primary` text `white` rounded `md`.
- **Range Middle**: `bg-primary/10` or `bg-accent/20`.
- **Today**: Bold text `text-primary`.
- **Hover**: `bg-muted` rounded `md`.
- **Navigation Icons**: Color `--icon-color`, hover to `primary`.

### Hover States (General)
Interactive elements must provide immediate visual feedback.
- **Action Elements**: Transform `translate-y-[-2px]` and brighten.
- **List Items**: `hover:bg-muted/30` or `hover:bg-primary/5`.
- **Cards**: Lift `translate-y-[-4px]` and border color shift to `primary/20`.

---

## 4. Layout & Spacing

### Breakpoints
- **Mobile**: `< 768px` (Stack layouts, use Drawer instead of Dialog often).
- **Tablet**: `768px - 1024px`.
- **Desktop**: `> 1024px`.
- **Max Container**: `1400px` (`.container-max`).

### Spacing Scale
- **Section Padding**: `py-24 px-4` (Generous spacing for premium feel).
- **Gap Standards**: `gap-4` (16px) for grids, `gap-2` (8px) for tight elements.

---

## 5. Iconography

**Library**: `lucide-react`.
**Standard Stroke**: `2px` (Medium weight).
**Colors**:
- Default: `--icon-color` (`hsl(58 2% 54%)`).
- Active/Primary: `--primary`.
- Functional: Match the functional color (e.g., Red for trash icons).

---

## 6. Effects, Utilities & Animations

### Shadows
- **Elegant**: `--shadow-elegant` (Soft, spread out).
- **Hover**: `--shadow-hover` (Stronger, indicates lift).
- **Card**: `--shadow-card` (Subtle depth).

### Background Effects
- **Main Body**: `radial-gradient` spots at 15% and 85% using `primary` with 2-3% opacity.
- **`.bg-noise`**: SVG noise filter with 0.05 opacity for texture.

### Scrollbars (`.custom-scrollbar`)
- **Width**: `4px` (Slim).
- **Track**: `rgba(0,0,0,0.05)`.
- **Thumb**: `rgba(0,0,0,0.2)` rounded.

### Animations
| Name | Description | Class |
| :--- | :--- | :--- |
| **Shimmer** | Loading skeleton wave | `.animate-shimmer` |
| **Shine** | Diagonal light gleam | `.effect-shine` |
| **Float** | Gentle vertical hovering | `.animate-float` |
| **Subtle Pulse** | Opacity breath | `.animate-subtle-pulse` |

### Technical Optimizations (Jitter Fix)
All interactive/transforming elements MUST use:
```css
transform: translate3d(0, 0, 0);
backface-visibility: hidden;
perspective: 1000px;
```
This forces GPU rendering to prevent sub-pixel blurring/jittering during animations.
