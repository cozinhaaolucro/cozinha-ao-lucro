import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type OnboardingStep =
    | 'dashboard-overview'
    | 'empty-product-list'
    | 'new-product-form'
    | 'template-list'
    | 'create-button'
    | 'success-moment'
    | 'completed';

interface OnboardingContextType {
    isActive: boolean;
    currentStep: OnboardingStep;
    completeTour: () => void;
    dismissTour: () => void;
    nextStep: () => void;
    setStep: (step: OnboardingStep) => void;
    checkEligibility: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('dashboard-overview');
    const [hasChecked, setHasChecked] = useState(false);

    const checkEligibility = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Local Persistence Check (User Scoped)
            const localPref = localStorage.getItem(`onboarding_completed_${user.id}`);

            if (localPref === 'true') {
                setHasChecked(true);
                return;
            }

            // Check if user has completed onboarding before
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single();

            if (profile?.has_completed_onboarding) {
                setHasChecked(true);
                return;
            }

            // Check if user has any products
            const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (count === 0) {
                setIsActive(true);
                setCurrentStep('dashboard-overview');
            } else {
                // If they have products but flag wasn't set, set it now
                await completeTour();
            }
        } catch (error) {
            console.error('Error checking onboarding eligibility:', error);
        } finally {
            setHasChecked(true);
        }
    };

    const completeTour = async () => {
        setIsActive(false);
        setCurrentStep('completed');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Persistent storage (User Scoped)
                localStorage.setItem(`onboarding_completed_${user.id}`, 'true');

                // Database sync (Upsert to ensure row exists)
                await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        has_completed_onboarding: true
                    }, { onConflict: 'id' });
            }
        } catch (error) {
            console.error('Error completing tour:', error);
        }
    };

    const dismissTour = () => {
        setIsActive(false);
    };

    const nextStep = () => {
        const steps: OnboardingStep[] = [
            'dashboard-overview',
            'empty-product-list',
            'new-product-form',
            'template-list',
            'create-button',
            'success-moment',
            'completed'
        ];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
        } else {
            completeTour();
        }
    };

    const setStep = (step: OnboardingStep) => {
        setCurrentStep(step);
    };

    return (
        <OnboardingContext.Provider value={{
            isActive,
            currentStep,
            completeTour,
            dismissTour,
            nextStep,
            setStep,
            checkEligibility
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
