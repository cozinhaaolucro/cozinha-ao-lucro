export type PlanType = 'free' | 'pro' | 'premium';

export interface PlanConfig {
    id: PlanType;
    name: string;
    price: number;
    limits: {
        orders: number; // per month
        products: number; // total active
        customers: number; // total
    };
    features: {
        ai_insights: boolean;
        public_menu: boolean;
        priority_support: boolean;
        custom_domain: boolean;
    };
}

export const PLANS: Record<PlanType, PlanConfig> = {
    free: {
        id: 'free',
        name: 'Gratuito',
        price: 0,
        limits: {
            orders: 30,
            products: 10,
            customers: 20
        },
        features: {
            ai_insights: false,
            public_menu: true,
            priority_support: false,
            custom_domain: false
        }
    },
    pro: {
        id: 'pro',
        name: 'PRO',
        price: 49.90,
        limits: {
            orders: 200,
            products: 20,
            customers: 150
        },
        features: {
            ai_insights: true,
            public_menu: true,
            priority_support: false,
            custom_domain: false
        }
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 97.00,
        limits: {
            orders: Infinity,
            products: Infinity,
            customers: Infinity
        },
        features: {
            ai_insights: true,
            public_menu: true,
            priority_support: true,
            custom_domain: true
        }
    }
};

export const CHECK_LIMITS = {
    ENABLED: true // Feature flag to easily disable limits
};
