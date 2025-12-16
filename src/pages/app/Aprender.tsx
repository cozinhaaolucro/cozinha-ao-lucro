import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download } from 'lucide-react';

const EBOOKS = [
    {
        id: 1,
        title: 'Cozinha ao Lucro',
        description: 'Guia completo para transformar sua cozinha em uma fonte de renda',
        file: '/ebook_cozinha_ao_lucro.pdf',
        cover: '/images/ebook_da_cozinha_ao_lucro_20251117_062259.png',
    },
    {
        id: 2,
        title: 'Receitas que Vendem',
        description: '50 receitas testadas com alto lucro e baixo custo',
        file: '/ebook_receitas_que_vendem.pdf',
        cover: '/images/ebook_receitas_que_vendem_20251117_062322.png',
    },
];

const Aprender = () => {
    const handleDownload = (file: string, title: string) => {
        const link = document.createElement('a');
        link.href = file;
        link.download = title + '.pdf';
        link.click();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BookOpen className="w-8 h-8" />
                    Aprender
                </h1>
                <p className="text-muted-foreground">Acesse seus materiais de estudo</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {EBOOKS.map((ebook) => (
                    <Card key={ebook.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-64 overflow-hidden bg-muted flex items-center justify-center">
                            <img
                                src={ebook.cover}
                                alt={ebook.title}
                                className="h-full object-contain"
                            />
                        </div>
                        <CardHeader>
                            <CardTitle>{ebook.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{ebook.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full gap-2"
                                onClick={() => {
                                    // Open in new tab/window
                                    window.open(ebook.file, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                <BookOpen className="w-4 h-4" />
                                Ler Agora
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => handleDownload(ebook.file, ebook.title)}
                            >
                                <Download className="w-4 h-4" />
                                Baixar
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Próximos Conteúdos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Em breve: Vídeo-aulas exclusivas, templates de precificação e muito mais! 🚀
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Aprender;
