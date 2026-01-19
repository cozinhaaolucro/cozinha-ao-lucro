import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { Outlet } from "react-router-dom";

export const AppProviders = () => {
    return (
        <AuthProvider>
            <NotificationProvider>
                <OnboardingProvider>
                    <Outlet />
                </OnboardingProvider>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default AppProviders;
