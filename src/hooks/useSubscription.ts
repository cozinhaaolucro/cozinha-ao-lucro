import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PLANS, PlanType, PlanConfig } from '@/config/plans';
import { Subscription, UsageMetrics } from '@/types/database';

interface UseSubscriptionReturn {
    plan: PlanConfig;
    subscription: Subscription | null;
    isLoading: boolean;
    checkLimit: (limitKey: keyof PlanConfig['limits'], currentCount: number) => boolean;
    canAccessFeature: (featureKey: keyof PlanConfig['features']) => boolean;
    usage: UsageMetrics;
}

export const useSubscription = (): UseSubscriptionReturn => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageMetrics>({
        orders_count_month: 0,
        products_count_total: 0,
        customers_count_total: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const userPlanId = subscription?.plan_id || 'free';
    const plan = PLANS[userPlanId];

    useEffect(() => {
        let mounted = true;

        const fetchSubscription = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Get Subscription
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .single(); // Assuming 1 active sub per user, or take latest

                if (mounted && subData) {
                    setSubscription(subData);
                }

                // 2. Get Usage (Mocked for now or fetched from API if table exists)
                // In a real implementation, you'd fetch from usage_metrics table
                // For now, let's just fetch count from tables directly for accuracy? 
                // No, sticking to plan: usage_metrics table or direct count cache.
                // Let's rely on what database.ts returns for counts usually.
                // But for centralized logic, let's fetch usage_metrics if it exists.
                const { data: usageData } = await supabase
                    .from('usage_metrics')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (mounted && usageData) {
                    setUsage(usageData);
                }

            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchSubscription();

        return () => {
            mounted = false;
        };
    }, []);

    const checkLimit = (limitKey: keyof PlanConfig['limits'], currentCount: number) => {
        const limit = plan.limits[limitKey];
        if (limit === Infinity) return true;
        return currentCount < limit;
    };

    const canAccessFeature = (featureKey: keyof PlanConfig['features']) => {
        return plan.features[featureKey];
    };

    return {
        plan,
        subscription,
        isLoading,
        checkLimit,
        canAccessFeature,
        usage
    };
};
