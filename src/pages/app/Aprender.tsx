import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, FileText } from 'lucide-react';

const CONTENT = [
    {
        id: 1,
        title: 'Cozinha ao Lucro - Guia Completo',
        description: 'Aprenda a transformar sua cozinha em uma fonte de renda estável',
        cover: '/images/ebook_da_cozinha_ao_lucro_20251117_062259.png',
        type: 'guide',
        pdfUrl: '/ebook_cozinha_ao_lucro.pdf',
    },
    {
        id: 2,
        title: 'Receitas que Vendem',
        description: '50 receitas testadas com alto lucro e baixo custo',
        cover: '/images/ebook_receitas_que_vendem_20251117_062322.png',
        type: 'recipe',
        pdfUrl: '/ebook_receitas_que_vendem.pdf',
    },
];

const Aprender = () => {
    return (
        <div className="space-y-6">


            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CONTENT.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">

                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardHeader>
                        <CardContent>
                            <a
                                href={item.pdfUrl}
                                download
                                className="block"
                            >
                                <Button className="w-full gap-2">
                                    <Download className="w-4 h-4" />
                                    Baixar PDF
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        🚀 Próximos Conteúdos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Vídeo-aulas exclusivas sobre precificação</li>
                        <li>• Templates prontos para fichas técnicas</li>
                        <li>• Guia de marketing para doceiras</li>
                        <li>• Comunidade de empreendedores</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default Aprender;
