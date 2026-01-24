import { useState } from 'react';
import { createOrder, createCustomer, getCustomers, getProducts } from '@/lib/database';
import { importFromExcel, getValue } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import type { Customer, OrderStatus } from '@/types/database';
import { STATUS_COLUMNS } from '@/components/orders/kanban/constants';

interface ImportRow {
    [key: string]: any; // Keep permissive for Excel row but safer than global any
}

interface ImportItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    unit_cost?: number;
}

export const useOrderImport = (onSuccess: () => void) => {
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async (file: File) => {
        setIsImporting(true);
        try {
            const data: ImportRow[] = await importFromExcel(file);
            const { data: existingCustomers } = await getCustomers() as { data: Customer[] | null; error: unknown };
            const { data: existingProducts } = await getProducts();
            let successCount = 0;
            let errorCount = 0;

            for (const row of data) {
                const customerName = getValue(row, ['Cliente', 'name', 'Customer', 'cliente', 'Nome']);
                if (!customerName || customerName === 'Não informado') continue;

                let customerId = existingCustomers?.find(c => c.name.toLowerCase() === customerName.toLowerCase())?.id;
                if (!customerId) {
                    const { data: newCust, error: custError } = await createCustomer({
                        name: customerName,
                        email: null, phone: null, address: null, notes: null, last_order_date: null
                    });
                    if (newCust && !custError) {
                        customerId = newCust.id; // Correctly typed now
                        existingCustomers?.push(newCust);
                    } else {
                        errorCount++; continue;
                    }
                }

                const statusLabel = getValue(row, ['Status', 'status', 'Estado', 'Situacao']);
                const statusKey = Object.keys(STATUS_COLUMNS).find(key =>
                    STATUS_COLUMNS[key as keyof typeof STATUS_COLUMNS].label === statusLabel ||
                    key === statusLabel?.toLowerCase()
                ) || 'pending';

                const itemsString = getValue(row, ['Items', 'items', 'Itens', 'Produtos', 'products']) || '';
                const items: ImportItem[] = [];
                if (itemsString) {
                    const itemParts = itemsString.split(',').map((s: string) => s.trim());
                    for (const part of itemParts) {
                        const match = part.match(/^(.*)\s\((\d+)\)$/);
                        const pName = match ? match[1].trim() : part;
                        const qty = match ? parseInt(match[2]) : 1;
                        const product = existingProducts?.find(p => p.name.toLowerCase() === pName.toLowerCase());
                        if (product) {
                            items.push({
                                product_id: product.id,
                                product_name: product.name,
                                quantity: qty,
                                unit_price: product.selling_price,
                                subtotal: product.selling_price * qty
                            });
                        }
                    }
                }

                const deliveryDateVal = getValue(row, ['Data Entrega', 'delivery_date', 'Data', 'Date', 'Entrega']);
                const deliveryDate = deliveryDateVal ? new Date(deliveryDateVal).toISOString() : null;

                const orderData = {
                    customer_id: customerId,
                    status: statusKey as OrderStatus,
                    delivery_date: deliveryDate,
                    delivery_time: null,
                    total_value: items.reduce((acc, item) => acc + item.subtotal, 0),
                    notes: 'Importado via Excel',
                    order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
                };

                if (items.length > 0) {
                    const { error } = await createOrder({
                        ...orderData,
                        total_cost: 0,
                        display_id: 0,
                        delivery_method: 'pickup',
                        delivery_fee: 0,
                        payment_method: 'pix',
                        google_event_id: null,
                        production_started_at: null,
                        production_completed_at: null,
                        production_duration_minutes: null,
                        delivered_at: null,
                        start_date: null
                    }, items as any); // Cast for import compatibility
                    if (!error) successCount++;
                    else errorCount++;
                } else {
                    errorCount++;
                }
            }
            toast({
                title: 'Importação Concluída',
                description: `${successCount} pedidos criados. ${errorCount} erros/ignorados.`,
                variant: successCount > 0 ? 'default' : 'destructive'
            });
            onSuccess();
        } catch (err) {
            console.error("Import error", err);
            toast({ title: 'Erro na importação', description: 'Falha ao ler arquivo', variant: 'destructive' });
        } finally {
            setIsImporting(false);
        }
    };

    return { handleImport, isImporting };
};
