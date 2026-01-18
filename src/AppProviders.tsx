import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Outlet } from "react-router-dom";

export const AppProviders = () => {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Outlet />
            </NotificationProvider>
        </AuthProvider>
    );
};

export default AppProviders;
