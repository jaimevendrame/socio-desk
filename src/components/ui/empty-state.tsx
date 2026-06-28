'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Inbox, Search, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: 'inbox' | 'search' | 'calendar' | 'users' | 'document';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const iconMap = {
  inbox: Inbox,
  search: Search,
  calendar: Inbox,
  users: Inbox,
  document: Inbox,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
        )}
        <div className="flex gap-2">
          {action && (
            <Button onClick={action.onClick}>
              <Plus className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive/50', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface LoadingStateProps {
  type?: 'skeleton' | 'spinner';
  className?: string;
}

export function LoadingState({ type = 'skeleton', className }: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-6">
        <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}