import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Perfil = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas configurações de conta aqui.</p>
        </div>
    );
};

export default Perfil;
