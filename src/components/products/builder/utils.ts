import { Ingredient } from "@/types/database";

export const getUnitOptions = (baseUnit: string, ingredient?: any) => {
    const normalized = baseUnit.toLowerCase();
    const options: string[] = [];

    // Mass
    if (['kg', 'quilo', 'kilograma', 'g', 'grama'].includes(normalized)) {
        options.push('kg', 'g');
    }
    // Volume
    else if (['l', 'litro', 'ml', 'mililitro'].includes(normalized)) {
        options.push('l', 'ml');
    }
    // Unit
    else {
        options.push('un');
    }

    if (ingredient?.package_size) {
        options.push('pacote');
    }

    // Return unique options
    return [...new Set(options)];
};

export const convertQuantity = (qty: number, fromUnit: string, toUnit: string, packageSize: number = 0, packageUnit?: string): number => {
    if (fromUnit === toUnit) return qty;

    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    // Package Logic
    if (from === 'pacote') {
        // If converting Package to Unit, and Package Unit dimension DOES NOT match Base Unit (e.g. 'g' vs 'un'),
        // default to 1 Package = 1 Unit.
        if (packageUnit && ['un', 'unidade'].includes(to) && !['un', 'unidade'].includes(packageUnit.toLowerCase())) {
            return qty;
        }
        return qty * packageSize;
    }
    if (to === 'pacote') {
        // If converting Unit to Package, and Base Unit is 'un' but Package Unit is 'g',
        // assume 1 Unit = 1 Package.
        if ((from === 'un' || from === 'unidade') && packageUnit && !['un', 'unidade'].includes(packageUnit.toLowerCase())) {
            return qty;
        }

        if (packageSize === 0) return qty;
        return qty / packageSize;
    }

    // Normalize inputs
    const isKg = ['kg', 'quilo', 'kilograma'].includes(from);
    const isG = ['g', 'grama'].includes(from);
    const isL = ['l', 'litro'].includes(from);
    const isMl = ['ml', 'mililitro'].includes(from);

    const targetIsKg = ['kg', 'quilo', 'kilograma'].includes(to);
    const targetIsG = ['g', 'grama'].includes(to);
    const targetIsL = ['l', 'litro'].includes(to);
    const targetIsMl = ['ml', 'mililitro'].includes(to);

    if (isKg && targetIsG) return qty * 1000;
    if (isG && targetIsKg) return qty / 1000;
    if (isL && targetIsMl) return qty * 1000;
    if (isMl && targetIsL) return qty / 1000;

    return qty;
};
