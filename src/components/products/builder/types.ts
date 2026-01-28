export type SelectedIngredient = {
    uniqueId: string;
    ingredient_id?: string;
    name: string;
    unit: string;
    cost: number;
    quantity: number;
    display_unit: string;
    display_quantity: number;
    is_virtual?: boolean;
    package_size?: number;
    package_unit?: string;
};

export interface ProductFormData {
    name: string;
    description: string;
    selling_price: number;
    category: string;
    preparation_time_minutes: number;
    hourly_rate: number;
    is_highlight: boolean;
}
