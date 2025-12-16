import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Minus, Plus, MessageCircle, MapPin, Store } from 'lucide-react';
import type { Product, Profile } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ExtendedProfile extends Profile {
    logo_url?: string;
    banner_url?: string;
    color_theme?: string;
    slug?: string | null;
}

interface CartItem {
    product: Product;
    quantity: number;
}

// Regex to check if string is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PublicMenu = () => {
    // We use a generic 'identifier' which can be userId OR slug
    const { userId: identifier } = useParams<{ userId: string }>();

    const [profile, setProfile] = useState<ExtendedProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (identifier) {
            loadMenuData();
        }
    }, [identifier]);

    const loadMenuData = async () => {
        setLoading(true);
        if (!identifier) return;

        let profileId = identifier;

        // 1. Determine if identifier is ID or Slug
        const isUuid = UUID_REGEX.test(identifier);

        if (!isUuid) {
            // It's a slug, fetch profile by slug to get ID
            const { data: slugProfile, error: slugError } = await supabase
                .from('profiles')
                .select('*')
                .eq('slug', identifier)
                .single();

            if (slugError || !slugProfile) {
                console.error('Error fetching profile by slug:', slugError);
                setLoading(false);
                return;
            }
            setProfile(slugProfile);
            profileId = slugProfile.id;
        } else {
            // It's a UUID, fetch directly
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                setLoading(false);
                return;
            }
            setProfile(profileData);
        }

        // 2. Fetch Active Products (using the resolved profileId)
        // We handle 'active' being null as true for backward compatibility
        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', profileId)
            .or('active.eq.true,active.is.null') // Fetch active or null (legacy)
            .order('name');

        if (productsError) console.error(productsError);
        else setProducts(productsData || []);

        setLoading(false);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        toast({ title: "Adicionado ao pedido", duration: 1500 });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === productId);
            if (existing && existing.quantity > 1) {
                return prev.map(item =>
                    item.product.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
            return prev.filter(item => item.product.id !== productId);
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.selling_price || 0) * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        if (!profile?.phone) {
            toast({ title: "Erro", description: "O estabelecimento não cadastrou um telefone.", variant: "destructive" });
            return;
        }

        let message = `*Olá ${profile.business_name || ''}! Gostaria de fazer um pedido:*\n\n`;

        cart.forEach(item => {
            message += `${item.quantity}x ${item.product.name} (R$ ${(item.product.selling_price || 0).toFixed(2)})\n`;
        });

        message += `\n*Total: R$ ${cartTotal.toFixed(2)}*\n`;

        if (customerName) message += `\nCliente: ${customerName}`;
        if (customerAddress) message += `\nEndereço: ${customerAddress}`;

        message += `\n\n(Enviado via Menu Digital cozinhalucro.com)`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = profile.phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

        const url = `https://wa.me/${finalPhone}?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando cardápio...</div>;
    }

    if (!profile) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cardápio não encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-md mx-auto p-6 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4 text-orange-600">
                        {profile.logo_url ? (
                            <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <Store className="w-10 h-10" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.business_name || 'Cardápio Digital'}</h1>
                    {profile.description && (
                        <p className="text-sm text-gray-600 mt-2 mb-3 max-w-sm mx-auto leading-relaxed">
                            {profile.description}
                        </p>
                    )}
                    <p className="text-gray-500 flex items-center justify-center gap-2 text-xs uppercase tracking-wide font-medium">
                        <MessageCircle className="w-4 h-4" /> Faça seu pedido pelo WhatsApp
                    </p>
                </div>
            </div>

            {/* Menu Items */}
            <div className="max-w-md mx-auto p-4 space-y-4">
                {products.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        Nenhum produto disponível no momento.
                    </div>
                ) : (
                    products.map(product => (
                        <Card key={product.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-0 flex items-center">
                                {product.image_url && (
                                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-4 flex-1 flex flex-col justify-between h-full min-h-[6rem]">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                                        </div>
                                        <Badge variant="outline" className="font-bold text-base text-primary border-primary bg-primary/5 px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                                            R$ {product.selling_price?.toFixed(2)}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 flex justify-end">
                                        <div className="flex items-center gap-2">
                                            {cart.find(i => i.product.id === product.id) ? (
                                                <div className="flex items-center bg-orange-50 rounded-lg p-1 border border-orange-100">
                                                    <Button
                                                        variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-200 rounded-md"
                                                        onClick={() => removeFromCart(product.id)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-8 text-center text-sm font-bold text-orange-700">
                                                        {cart.find(i => i.product.id === product.id)?.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-200 rounded-md"
                                                        onClick={() => addToCart(product)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="outline" className="h-8 text-xs bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" onClick={() => addToCart(product)}>
                                                    Adicionar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Floating Cart Footer */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 p-4 safe-area-pb">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <ShoppingBag className="w-4 h-4 mt-0.5" />
                                <span>{cartCount} item(s)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCart([])}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                                >
                                    Limpar
                                </button>
                                <div className="text-lg font-bold text-gray-900">
                                    Total: R$ {cartTotal.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Input
                                placeholder="Seu Nome (Opcional)"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="h-9 text-sm bg-gray-50"
                            />
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Endereço de Entrega (Opcional)"
                                    value={customerAddress}
                                    onChange={e => setCustomerAddress(e.target.value)}
                                    className="pl-9 h-9 text-sm bg-gray-50"
                                />
                            </div>
                        </div>

                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white gap-2 h-12 text-lg font-semibold shadow-md active:scale-[0.98] transition-all" onClick={handleCheckout}>
                            <MessageCircle className="w-5 h-5" />
                            Enviar Pedido no WhatsApp
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicMenu;
