import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
    className?: string;
}

const QRCodeGenerator = ({ className }: QRCodeGeneratorProps) => {
    const { profile } = useAuth();
    const [copied, setCopied] = useState(false);

    // Generate the menu URL based on profile slug or user ID
    const baseUrl = window.location.origin;
    const menuSlug = profile?.slug || profile?.id || 'menu';
    const menuUrl = `${baseUrl}/menu/${menuSlug}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl);
            setCopied(true);
            toast.success('Link copiado!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Erro ao copiar link');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Meu Cardápio Digital',
                    text: 'Confira meu cardápio!',
                    url: menuUrl,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            handleCopy();
        }
    };

    const handleOpenMenu = () => {
        window.open(menuUrl, '_blank');
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    <CardTitle>QR Code do Cardápio</CardTitle>
                </div>
                <CardDescription>
                    Compartilhe seu cardápio digital com seus clientes
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-lg border">
                        <QRCodeSVG
                            value={menuUrl}
                            size={180}
                            level="H"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#1a1a1a"
                        />
                    </div>
                </div>

                {/* URL Display */}
                <div className="flex gap-2">
                    <Input
                        value={menuUrl}
                        readOnly
                        className="text-sm font-mono bg-muted"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className="shrink-0"
                    >
                        <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={handleOpenMenu}
                    >
                        <ExternalLink className="w-4 h-4" />
                        Abrir Cardápio
                    </Button>
                    <Button
                        className="flex-1 gap-2"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4" />
                        Compartilhar
                    </Button>
                </div>

                {/* Tips */}
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground space-y-2">
                    <p className="flex items-start gap-2">
                        <Badge variant="secondary" className="text-xs">Dica</Badge>
                        Imprima o QR Code e coloque no balcão da sua cozinha!
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default QRCodeGenerator;
