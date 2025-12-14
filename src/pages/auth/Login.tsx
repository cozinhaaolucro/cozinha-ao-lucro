
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// Production URL for OAuth redirect (used as fallback)
const PRODUCTION_URL = 'https://cozinha-ao-lucro.vercel.app';

// Deep link scheme for returning to native app
const DEEP_LINK_SCHEME = 'cozinhaaolucro';

const getRedirectUrl = () => {
    if (Capacitor.isNativePlatform()) {
        // Use deep link to return directly to the app
        return `${DEEP_LINK_SCHEME}://app/dashboard`;
    }
    return `${window.location.origin}/app/dashboard`;
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const { user } = useAuth(); // Get user from context

    useEffect(() => {
        if (user) {
            navigate('/app/dashboard');
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // Navigation handled by useEffect when user state updates
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login';
            setError(message);
            setLoading(false); // Only stop loading on error, otherwise wait for redirect
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/images/logo_circle.png" alt="Logo" className="h-16 w-auto" />
                    </div>
                    <CardDescription>
                        Entre para gerenciar seu negócio
                    </CardDescription>


                </CardHeader>

                <CardContent>
                    {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                                <strong>Configuração Pendente:</strong> O arquivo .env não foi carregado corretamente.
                                <br />
                                1. Verifique se salvou o arquivo.
                                <br />
                                2. Reinicie o terminal (npm run dev).
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-4">

                        {!Capacitor.isNativePlatform() && (
                            <>
                                <Button variant="outline" onClick={async () => {
                                    await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            scopes: 'https://www.googleapis.com/auth/calendar',
                                            queryParams: { access_type: 'offline', prompt: 'consent' },
                                            redirectTo: `${window.location.origin}/app/dashboard`
                                        }
                                    });
                                }} className="w-full gap-2">
                                    <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                    </svg>
                                    Entrar com Google
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Ou continue com email</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Entrar
                            </Button>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center">
                    <div className="text-sm text-muted-foreground">
                        Ainda não tem conta?{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Criar conta grátis
                        </Link>
                    </div>
                    <div className="text-xs text-muted-foreground mt-4">
                        <Link to="/" className="hover:text-foreground transition-colors">
                            ← Voltar para o site
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
