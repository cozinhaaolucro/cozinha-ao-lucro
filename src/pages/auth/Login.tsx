
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const plan = searchParams.get('plan');

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

            if (plan) {
                navigate(`/checkout?plan=${plan}`);
            } else {
                navigate('/app/dashboard');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            // Try to login first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: 'admin@demo.com',
                password: 'admin',
            });

            if (signInError) {
                // If login fails, try to sign up
                const { error: signUpError } = await supabase.auth.signUp({
                    email: 'admin@demo.com',
                    password: 'admin',
                });

                if (signUpError) throw signUpError;
            }

            navigate('/app/dashboard');
        } catch (err: unknown) {
            console.error('Admin login error:', err);
            const message = err instanceof Error ? err.message : 'Erro ao entrar como admin';
            if (message === 'Failed to fetch') {
                setError('Erro de conexão com o servidor. Verifique sua internet ou a configuração do Supabase.');
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Cozinha ao Lucro</CardTitle>
                    <CardDescription>
                        Entre para gerenciar seu negócio
                    </CardDescription>

                    {plan && (
                        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-sm text-muted-foreground mb-1">Você selecionou:</p>
                            <p className="font-bold text-foreground">
                                {plan === 'annual' ? 'Plano Anual (R$ 399,00)' : 'Plano Mensal (R$ 39,90)'}
                            </p>
                            <p className="text-xs text-green-600 mt-1">Continue para finalizar a assinatura</p>
                        </div>
                    )}
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
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2 border-primary/20 hover:bg-primary/5"
                            onClick={handleAdminLogin}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Entrar como Admin (Demo)
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center">
                    <div className="text-sm text-muted-foreground">
                        Ainda não tem conta?{' '}
                        <Link to={`/register${window.location.search}`} className="text-primary hover:underline font-medium">
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
        </div >
    );
};

export default Login;
