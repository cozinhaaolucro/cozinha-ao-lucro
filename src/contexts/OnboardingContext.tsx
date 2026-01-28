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
    // Fix: Add state to track if user explicitly dismissed the tour in this session
    const [isDismissed, setIsDismissed] = useState(false);

    const completeTour = React.useCallback(async () => {
        setIsActive(false);
        setCurrentStep('completed');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
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
    }, []);

    // Fix: Wrap in useCallback to prevent infinite useEffect loops in consumers
    const checkEligibility = React.useCallback(async () => {
        // If already checked, active, or explicitly dismissed, stop.
        if (hasChecked || isActive || isDismissed) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const localPref = localStorage.getItem(`onboarding_completed_${user.id}`);
            if (localPref === 'true') {
                setHasChecked(true);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single();

            if (profile?.has_completed_onboarding) {
                setHasChecked(true);
                return;
            }

            const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (count === 0) {
                setIsActive(true);
                setCurrentStep('dashboard-overview');
            } else {
                await completeTour();
            }
        } catch (error) {
            console.error('Error checking onboarding eligibility:', error);
        } finally {
            setHasChecked(true);
        }
    }, [hasChecked, isActive, isDismissed, completeTour]);

    const dismissTour = React.useCallback(() => {
        setIsActive(false);
        setIsDismissed(true); // Prevent re-opening in this session
    }, []);

    const nextStep = React.useCallback(() => {
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
    }, [currentStep, completeTour]);

    const setStep = React.useCallback((step: OnboardingStep) => {
        setCurrentStep(step);
    }, []);

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
