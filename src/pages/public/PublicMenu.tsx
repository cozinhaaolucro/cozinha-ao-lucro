import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Minus, Plus, MessageCircle, MapPin, Store, Star, ChevronLeft, Search, X, Clock, Flame } from 'lucide-react';
import type { Product, Profile } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ExtendedProfile extends Profile {
    logo_url?: string;
    banner_url?: string;
    color_theme?: string;
    slug?: string | null;
}

interface CartItem {
    product: Product;
    quantity: number;
    observation?: string;
}

// Regex to check if string is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PublicMenu = () => {
    const { userId: identifier } = useParams<{ userId: string }>();
    const isMobile = useIsMobile();
    const { toast } = useToast();

    // Data State
    const [profile, setProfile] = useState<ExtendedProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [activeCategory, setActiveCategory] = useState('Destaques');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [itemObservation, setItemObservation] = useState(''); // For the current selected product
    const [quantity, setQuantity] = useState(1); // For the current selected product

    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (identifier) loadMenuData();
    }, [identifier]);

    // Scroll Spy Effect
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 150; // Offset for header

            // Find current category
            for (const category of categories) {
                const element = categoryRefs.current[category];
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveCategory(category);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [products]); // Re-run when products (and thus categories) change

    const loadMenuData = async () => {
        setLoading(true);
        if (!identifier) return;

        let profileId = identifier;
        const isUuid = UUID_REGEX.test(identifier);

        if (!isUuid) {
            const { data: slugProfile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('slug', identifier)
                .single();
            if (error || !slugProfile) {
                setLoading(false);
                return;
            }
            setProfile(slugProfile);
            profileId = slugProfile.id;
        } else {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();
            if (error) {
                setLoading(false);
                return;
            }
            setProfile(profileData);
        }

        console.log("Fetching products for:", profileId);

        // Fetch Products with Ingredients for detail view
        let finalProducts = [];

        // Try fetching with ingredients first
        const { data: detailedProducts, error: detailedError } = await supabase
            .from('products')
            .select('*, product_ingredients(quantity, ingredient(name, unit))')
            .eq('user_id', profileId)
            .or('active.eq.true,active.is.null')
            .order('category', { ascending: true })
            .order('name');

        if (detailedError) {
            console.error("Detailed Fetch Error:", detailedError);
            // Fallback: Fetch basic products if ingredients RLS fails
            const { data: basicProducts, error: basicError } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', profileId)
                .or('active.eq.true,active.is.null')
                .order('category', { ascending: true })
                .order('name');

            if (basicError) {
                setError(`Erro total: ${basicError.message}`);
                toast({ title: "Erro Crítico", description: basicError.message, variant: "destructive" });
            } else {
                finalProducts = basicProducts || [];
                // Warning silenced as per request
            }
        } else {
            finalProducts = detailedProducts || [];
        }

        setProducts(finalProducts);
        setLoading(false);
    };



    // Derived Data
    const highlights = useMemo(() => products.filter(p => p.is_highlight), [products]);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        if (highlights.length > 0) cats.add('Destaques');
        products.forEach(p => {
            if (p.category) cats.add(p.category);
            else cats.add('Geral');
        });
        // Sort categories if needed, or keep insertion order (Set iterates in insertion order)
        // Usually we want 'Destaques' first.
        return Array.from(cats);
    }, [products, highlights]);

    const groupedProducts = useMemo(() => {
        const grouped: Record<string, Product[]> = {};
        products.forEach(p => {
            const cat = p.category || 'Geral';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(p);
        });
        return grouped;
    }, [products]);

    // Theme Logic
    const themeColor = profile?.color_theme || 'orange';

    // Map theme to Tailwind classes (safelist these or use style if needed, but simple map is cleaner)
    // Note: Since we can't easily dynamize tailwind classes like `bg-${color}-500` without safelisting ALL colors,
    // we will use inline styles for the main color, or a map of complete class strings.
    // Map is safer for tree-shaking usually if keys are static strings.
    const themeClasses: any = {
        orange: { primary: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
        red: { primary: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
        green: { primary: 'bg-green-600', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
        blue: { primary: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
        purple: { primary: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
        pink: { primary: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' },
        black: { primary: 'bg-zinc-900', text: 'text-zinc-900', light: 'bg-zinc-100', border: 'border-zinc-200', badge: 'bg-zinc-100 text-zinc-900' },
    };

    const currentTheme = themeClasses[themeColor] || themeClasses['orange'];

    // Handlers
    const scrollToCategory = (category: string) => {
        setActiveCategory(category);
        const element = categoryRefs.current[category];
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 120; // Offset for sticky header
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const openProductModal = (product: Product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setItemObservation('');
        setIsProductModalOpen(true);
    };

    const closeProductModal = () => {
        setIsProductModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    const handleAddToCart = () => {
        if (!selectedProduct) return;

        setCart(prev => {
            // Check if exact same item (product + observation) exists? 
            // Usually observation makes it unique row? Or just simple stack?
            // Simple stack for now.
            return [...prev, {
                product: selectedProduct,
                quantity: quantity,
                observation: itemObservation
            }];
        });

        toast({ title: "Adicionado ao pedido!", className: `${currentTheme.primary} text-white border-none` });
        closeProductModal();
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateCartItemQty = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const newQty = item.quantity + delta;
            if (newQty <= 0) return prev.filter((_, i) => i !== index);
            newCart[index] = { ...item, quantity: newQty };
            return newCart;
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.selling_price || 0) * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        if (!profile?.phone) {
            toast({ title: "Erro", description: "Telefone não cadastrado.", variant: "destructive" });
            return;
        }

        let message = `*Novo Pedido - ${profile.business_name}*\n\n`;

        cart.forEach((item, i) => {
            message += `${item.quantity}x *${item.product.name}*\n`;
            if (item.observation) message += `   Obs: ${item.observation}\n`;
            message += `   R$ ${(item.product.selling_price || 0).toFixed(2)}\n\n`;
        });

        message += `*Total: R$ ${cartTotal.toFixed(2)}*\n`;
        message += `--------------------------------\n`;

        if (customerName) message += `👤 Cliente: ${customerName}\n`;
        if (customerAddress) message += `📍 Endereço: ${customerAddress}\n`;

        message += `\nLink do pedido: ${window.location.href}`;

        const encoded = encodeURIComponent(message);
        const phone = profile.phone.replace(/\D/g, '');
        const finalPhone = phone.length <= 11 ? `55${phone}` : phone;

        window.open(`https://wa.me/${finalPhone}?text=${encoded}`, '_blank');
        setIsCartOpen(false); // Close cart on send? Maybe just leave open.
        setCart([]); // Allow clearing logic or keep it? Maybe keep it for reference? 
        // Better clear to prevent double send. Or show success modal.
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <Store className="w-12 h-12 text-gray-300 animate-pulse" />
                <p className="text-gray-400 font-medium text-sm tracking-wide">Carregando cardápio...</p>
            </div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
            Cardápio indisponível.
        </div>
    );

    // Modal Content Component
    const ProductModalContent = selectedProduct ? (
        <div className="space-y-6">
            <div className="relative h-64 -mx-6 -mt-6 bg-gray-100">
                {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt={selectedProduct.name} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Store className="w-16 h-16 text-gray-300" />
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                    {/* Could put title here but Drawer header handles it usually. */}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                        <span className="text-xl font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                            R$ {(selectedProduct.selling_price || 0).toFixed(2)}
                        </span>
                    </div>
                    {selectedProduct.description && (
                        <p className="text-gray-600 leading-relaxed mt-2">{selectedProduct.description}</p>
                    )}
                </div>

                {/* Info Badges */}
                <div className="flex gap-3 text-sm text-gray-500">
                    {selectedProduct.preparation_time_minutes > 0 && (
                        <Badge variant="secondary" className="gap-1 font-normal bg-gray-100 text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            {selectedProduct.preparation_time_minutes} min
                        </Badge>
                    )}
                    {selectedProduct.category && (
                        <Badge variant="secondary" className={`gap-1 font-normal ${currentTheme.badge}`}>
                            {selectedProduct.category}
                        </Badge>
                    )}
                </div>

                <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium text-gray-900">Observações para a cozinha</label>
                    <Input
                        placeholder="Ex: Sem cebola, ponto da carne..."
                        value={itemObservation}
                        onChange={(e) => setItemObservation(e.target.value)}
                        className={`bg-gray-50 border-gray-200 focus:ring-${themeColor}-500`}
                    />
                </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center border rounded-lg h-12 bg-gray-50">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-l-lg hover:bg-gray-200"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-r-lg hover:bg-gray-200"
                        onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <Button
                    className={`flex-1 h-12 text-base font-semibold ${currentTheme.primary} hover:opacity-90`}
                    onClick={handleAddToCart}
                >
                    Adicionar • R$ {((selectedProduct.selling_price || 0) * quantity).toFixed(2)}
                </Button>
            </div>
        </div>
    ) : null;

    const getProductQuantity = (productId: string) => {
        return cart.reduce((total, item) => {
            return item.product.id === productId ? total + item.quantity : total;
        }, 0);
    };

    const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        setCart(prev => {
            const existingItemIndex = prev.findIndex(item => item.product.id === product.id && !item.observation);
            if (existingItemIndex > -1) {
                const newCart = [...prev];
                newCart[existingItemIndex].quantity += 1;
                return newCart;
            } else {
                return [...prev, { product, quantity: 1, observation: '' }];
            }
        });
        toast({ title: "Adicionado!", className: `${currentTheme.primary} text-white border-none duration-1000` });
    };

    const handleQuickRemove = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        setCart(prev => {
            const existingItemIndex = prev.findIndex(item => item.product.id === product.id && !item.observation);
            if (existingItemIndex > -1) {
                const newCart = [...prev];
                if (newCart[existingItemIndex].quantity > 1) {
                    newCart[existingItemIndex].quantity -= 1;
                    return newCart;
                } else {
                    return prev.filter((_, i) => i !== existingItemIndex);
                }
            }
            // If only items with observations exist, we maybe shouldn't auto-remove them from the quick card view
            // to avoid accidents. Or we remove the last added one?
            // For now, let's strictly handle the "clean" items (no observation) for quick actions
            // or if we want to be smart, remove the last added occurrence of this product.
            // Let's stick to "clean" items first for safety.
            return prev;
        });
    };

    return (
        <div className={`bg-white min-h-screen pb-32 font-sans selection:${currentTheme.badge}`}>
            {/* 1. Hero Section */}
            <div className="relative h-[25vh] md:h-[30vh] bg-gray-900 overflow-hidden">
                {/* Banner Image or Gradient background */}
                {profile.banner_url ? (
                    <img src={profile.banner_url} className="w-full h-full object-cover opacity-80" alt="Banner" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto">
                    <div className="flex items-end gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0">
                            {profile.logo_url ? (
                                <img src={profile.logo_url} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                            ) : (
                                <div className={`w-full h-full rounded-xl ${currentTheme.light} flex items-center justify-center`}>
                                    <Store className={`w-10 h-10 ${currentTheme.text}`} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-white pb-1">
                            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{profile.business_name}</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                                <span className="flex items-center gap-1 text-yellow-400 font-bold"><Star className="w-3.5 h-3.5 fill-current" /> 4.9</span>
                                <span>•</span>
                                <span>{profile.description || 'Cardápio Digital'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Sticky Search & Categories */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b">
                <div className="max-w-2xl mx-auto">
                    {/* Search Bar (Expandable or always visible?) - Let's keep it simple: Category bar */}
                    {/* Categories Horizontal Scroll */}
                    <div className="flex items-center gap-2 overflow-x-auto p-4 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => scrollToCategory(cat)}
                                className={`
                                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform
                                    ${activeCategory === cat
                                        ? `${currentTheme.primary} text-white shadow-md scale-105`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {cat === 'Destaques' && <Flame className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Content Area */}
            <div className="max-w-2xl mx-auto p-4 space-y-12 min-h-[60vh]">

                {/* Highlights Section */}
                {highlights.length > 0 && (
                    <div ref={el => categoryRefs.current['Destaques'] = el} className="space-y-4 pt-4 scroll-mt-32">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Flame className={`w-5 h-5 ${currentTheme.text} fill-current`} />
                            Destaques
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {highlights.map(product => {
                                const qty = getProductQuantity(product.id);
                                return (
                                    <motion.div
                                        key={product.id}
                                        whileTap={{ scale: 0.98 }}
                                        className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all relative"
                                        onClick={() => openProductModal(product)}
                                    >
                                        <div className="aspect-[4/3] bg-gray-100 relative">
                                            {product.image_url && <img src={product.image_url} className="w-full h-full object-cover" />}
                                            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                                R$ {product.selling_price?.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                                        </div>

                                        {/* Quick Add Overlay/Controls */}
                                        <div className={`
                                        absolute top-2 right-2 flex flex-col gap-2 
                                        ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                                        transition-opacity duration-200
                                    `}>
                                            {qty > 0 ? (
                                                <div className="flex flex-col items-center bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => handleQuickAdd(e, product)}
                                                        className={`p-1.5 ${currentTheme.light} ${currentTheme.text} hover:brightness-95`}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-xs font-bold py-0.5 px-1.5 min-w-[1.5rem] text-center bg-white">{qty}</span>
                                                    <button
                                                        onClick={(e) => handleQuickRemove(e, product)}
                                                        className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleQuickAdd(e, product)}
                                                    className={`p-2 rounded-full shadow-lg text-white ${currentTheme.primary} hover:opacity-90 transform hover:scale-110 transition-all`}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Categorized Products */}
                {Object.entries(groupedProducts).map(([category, catProducts]) => (
                    <div key={category} ref={el => categoryRefs.current[category] = el} className="space-y-4 scroll-mt-32">
                        <h2 className="text-xl font-bold text-gray-900">{category}</h2>

                        <div className="space-y-3">
                            {catProducts.map((product) => {
                                const qty = getProductQuantity(product.id);
                                return (
                                    <motion.div
                                        key={product.id}
                                        layoutId={`product-${product.id}`}
                                        className={`group relative flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:${currentTheme.border} transition-colors cursor-pointer`}
                                        onClick={() => openProductModal(product)}
                                    >
                                        <div className="flex-1 space-y-1 relative z-10">
                                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
                                            <div className="pt-1 font-bold text-gray-900">
                                                R$ {(product.selling_price || 0).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="relative shrink-0">
                                            {product.image_url ? (
                                                <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden">
                                                    <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 rounded-lg bg-gray-50 flex items-center justify-center">
                                                    <Store className="w-8 h-8 text-gray-200" />
                                                </div>
                                            )}

                                            {/* Categorized List Quick Add */}
                                            <div className={`
                                            absolute -bottom-2 -right-2 
                                            ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                                            transition-opacity duration-200 z-20
                                        `}>
                                                {qty > 0 ? (
                                                    <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleQuickRemove(e, product)}
                                                            className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-sm font-bold px-2 min-w-[1.5rem] text-center">{qty}</span>
                                                        <button
                                                            onClick={(e) => handleQuickAdd(e, product)}
                                                            className={`p-2 ${currentTheme.light} ${currentTheme.text} hover:opacity-90`}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => handleQuickAdd(e, product)}
                                                        className={`p-2.5 rounded-full shadow-lg text-white ${currentTheme.primary} hover:opacity-90 transform hover:scale-105 transition-all`}
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                ))}

                <div className="h-20" /> {/* Spacer */}
            </div>

            {/* 4. Cart Floating Indicator / Checkout Button */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-gradient-to-t from-white via-white to-transparent pb-8"
                    >
                        <div className="max-w-2xl mx-auto">
                            <Button
                                onClick={() => setIsCartOpen(true)}
                                className="w-full h-14 rounded-xl shadow-xl bg-gray-900 hover:bg-black text-white flex items-center justify-between px-6 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                                        {cartCount}
                                    </div>
                                    <span className="font-semibold text-lg">Ver Sacola</span>
                                </div>
                                <div className="font-bold text-lg">
                                    R$ {cartTotal.toFixed(2)}
                                </div>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 5. Modals */}
            {isMobile ? (
                <Drawer open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                    <DrawerContent className="max-h-[90vh]">
                        {/* We use a custom content wrapper to allow scrolling if content is long */}
                        <div className="max-h-[85vh] overflow-y-auto px-6 pb-8 pt-2">
                            {ProductModalContent}
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
                        <ScrollArea className="flex-1 p-6">
                            {ProductModalContent}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            )}

            {/* Cart Drawer check out */}
            <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
                <DrawerContent className="max-h-[95vh] h-[90vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-center text-xl">Seu Pedido</DrawerTitle>
                        <DrawerDescription className="text-center">{profile.business_name}</DrawerDescription>
                    </DrawerHeader>

                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            {/* Items List */}
                            <div className="space-y-4">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex gap-4 py-2 border-b last:border-0 border-gray-100">
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-semibold text-gray-900">{item.quantity}x {item.product.name}</h4>
                                                <span className="font-medium text-gray-900">R$ {((item.product.selling_price || 0) * item.quantity).toFixed(2)}</span>
                                            </div>
                                            {item.observation && (
                                                <p className="text-sm text-gray-500 mt-1">Obs: {item.observation}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2">
                                                <button onClick={() => updateCartItemQty(index, -1)} className="text-gray-400 hover:text-red-500 text-sm font-medium">Remover</button>
                                                <button onClick={() => updateCartItemQty(index, 1)} className={`${currentTheme.text} hover:opacity-80 text-sm font-medium`}>Adicionar +</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <div className="text-center text-gray-400 py-10">
                                        Sua sacola está vazia.
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            {cart.length > 0 && (
                                <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                                    <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Entrega
                                    </h5>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Seu Nome"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            className="bg-white"
                                        />
                                        <Input
                                            placeholder="Endereço Completo (Rua, Número, Bairro...)"
                                            value={customerAddress}
                                            onChange={e => setCustomerAddress(e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="shrink-0 border-t p-6 bg-white safe-area-pb">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">R$ {cartTotal.toFixed(2)}</span>
                                </div>
                                <Button
                                    className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 rounded-xl"
                                    onClick={handleCheckout}
                                >
                                    <MessageCircle className="w-6 h-6 mr-2" />
                                    Enviar Pedido WhatsApp
                                </Button>
                            </div>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default PublicMenu;
