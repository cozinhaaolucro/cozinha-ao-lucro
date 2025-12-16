
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-red-50 rounded-xl border border-red-100 m-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-900 mb-2">Ops, algo deu errado!</h2>
                    <p className="text-red-700 mb-6 max-w-md">
                        Ocorreu um erro ao carregar esta parte da aplicação.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-red-200 text-left w-full max-w-lg overflow-auto max-h-40 mb-6">
                        <code className="text-xs text-red-800 font-mono">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
