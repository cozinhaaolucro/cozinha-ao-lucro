import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUnit(value: number, unit: string) {
  if (!unit) return '';
  const cleanUnit = unit.toLowerCase().trim();

  // Singular is usually just the unit name, unless special logic needed
  if (value === 1) return cleanUnit;

  switch (cleanUnit) {
    case 'unidade': return 'unidades';
    case 'litro': return 'litros';
    case 'grama': return 'gramas';
    case 'caixa': return 'caixas';
    case 'pacote': return 'pacotes';
    case 'garrafa': return 'garrafas';
    case 'lata': return 'latas';
    // Abbreviations usually don't pluralize in display
    case 'kg': return 'kg';
    case 'ml': return 'ml';
    case 'un': return 'un';
    default: return cleanUnit;
  }
}
