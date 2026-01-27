import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const HeaderAction = ({ children }: { children: React.ReactNode }) => {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = document.getElementById('header-actions');
        if (el) setContainer(el);
    }, []);

    if (!container) return null;

    return createPortal(children, container);
};
