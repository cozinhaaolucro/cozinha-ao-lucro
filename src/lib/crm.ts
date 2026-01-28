import { OrderWithDetails, Customer, OrderStatus } from '@/types/database';

export const parseMessageTemplate = (
    template: string,
    order?: OrderWithDetails | null,
    customer?: Customer | null
): string => {
    let message = template;

    if (customer) {
        message = message.replace(/{client_name}/g, customer.name.split(' ')[0]);
        message = message.replace(/{client_full_name}/g, customer.name);
    }

    if (order) {
        message = message.replace(/{order_id}/g, order.order_number || order.id.slice(0, 8));
        message = message.replace(/{total_value}/g, `R$ ${order.total_value.toFixed(2)}`);
        message = message.replace(/{delivery_date}/g, order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : 'Data a confirmar');

        const itemsList = order.items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ') || '';
        message = message.replace(/{items}/g, itemsList);
    }

    return message;
};

export const generateWhatsAppLink = (phone: string, message: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const getDefaultTemplateForStatus = (status: OrderStatus): string => {
    switch (status) {
        case 'pending':
            return "Olá {client_name}! Recebemos seu pedido #{order_id} no valor de {total_value}. Já vamos confirmar e começar a preparar! 👩‍🍳";
        case 'preparing':
            return "Oi {client_name}! Tudo certo com seu pedido #{order_id}. Ele já está sendo preparado com muito carinho e em breve estará pronto! 🥘";
        case 'ready':
            return "Olá {client_name}! Boas notícias: seu pedido #{order_id} está pronto e saindo para entrega/retirada! 🎉";
        case 'delivered':
            return "Oi {client_name}, seu pedido foi entregue! Espero que goste. Muito obrigado pela preferência e até a próxima! ❤️";
        case 'cancelled':
            return "Olá {client_name}, infelizmente seu pedido #{order_id} precisou ser cancelado. Por favor, entre em contato para mais detalhes.";
        default:
            return "";
    }
};
