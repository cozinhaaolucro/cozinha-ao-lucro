import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { seedAccount } from '@/lib/seeding';
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

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const usePresets = true; // Always enabled
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            if (usePresets) {
                localStorage.setItem('should_seed_account', 'true');
            }
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/calendar',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: getRedirectUrl(),
                },
            });
            if (error) throw error;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao conectar com Google';
            setError(message);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                if (usePresets) {
                    await seedAccount();
                }
                // User requested redirect to login section instead of dashboard
                navigate('/login');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar conta';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-primary/20 shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/images/logo_circle.png" alt="Logo" className="h-16 w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-primary">Comece Agora</CardTitle>
                    <CardDescription>
                        Crie sua conta e profissionalize sua cozinha
                    </CardDescription>
                    <p className="text-xs text-green-600 mt-2">🎉 7 Dias Grátis!</p>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">



                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Maria da Silva"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="(11) 98765-4321"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
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
                                <Label htmlFor="password">Senha *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pb-2">
                                {/* Presets always enabled */}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Criar Conta
                            </Button>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center">
                    <div className="text-sm text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Fazer Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;

