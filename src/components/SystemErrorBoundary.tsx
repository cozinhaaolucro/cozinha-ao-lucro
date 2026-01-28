import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class SystemErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logError({
            error,
            severity: 'critical',
            functionName: 'SystemErrorBoundary',
            details: { componentStack: errorInfo.componentStack }
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                            <AlertTriangle className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Ops, algo deu errado!</h2>
                            <p className="text-gray-500 text-sm">
                                Ocorreu um erro inesperado. Nosso sistema já registrou o problema e estamos trabalhando na solução.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-gray-100 rounded text-left overflow-auto text-xs font-mono text-gray-700 max-h-32">
                                    {this.state.error.toString()}
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recarregar Página
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
