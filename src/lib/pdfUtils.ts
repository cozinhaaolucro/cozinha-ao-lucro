import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Re-export autoTable for convenience
export { autoTable };

export const addPdfHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    // Images
    const iconUrl = '/images/logo-icon-2026.png';
    const fullLogoUrl = '/images/logo-full.png';

    try {
        // Icon (Left)
        doc.addImage(iconUrl, 'PNG', 14, 10, 10, 10); // Square icon

        // Full Logo (Right of Icon)
        doc.addImage(fullLogoUrl, 'PNG', 26, 11, 35, 8); // Adjusted rectangular aspect ratio
    } catch (e) {
        console.warn('Logo load failed', e);
        // Fallback
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.text('Cozinha ao Lucro', 14, 20);
    }

    // Title aligned right
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.width - 14, 20, { align: 'right' });

    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, doc.internal.pageSize.width - 14, 26, { align: 'right' });
    }

    // Divider Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 30, doc.internal.pageSize.width - 14, 30);
};

export const addPdfFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Left: System Name
        doc.text('Gerado pelo Sistema Cozinha ao Lucro', 14, doc.internal.pageSize.height - 10);

        // Right: Date/Time
        const now = new Date().toLocaleString('pt-BR');
        doc.text(`${now} • Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
    }
};
