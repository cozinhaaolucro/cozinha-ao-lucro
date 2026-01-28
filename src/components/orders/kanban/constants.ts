export const STATUS_COLUMNS = {
    pending: { label: 'A Fazer', key: 'pending' },
    preparing: { label: 'Em Produção', key: 'preparing' },
    ready: { label: 'Pronto', key: 'ready' },
    delivered: { label: 'Entregue', key: 'delivered' },
} as const;

export type StatusKey = keyof typeof STATUS_COLUMNS;
