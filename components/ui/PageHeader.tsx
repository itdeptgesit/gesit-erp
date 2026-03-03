import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export const PageHeader = ({ title, description, children }: PageHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
};
