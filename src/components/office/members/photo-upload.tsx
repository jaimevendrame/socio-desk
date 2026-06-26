'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  memberId: string;
  onUploadComplete?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function PhotoUpload({
  currentPhotoUrl,
  memberId,
  onUploadComplete,
  size = 'md',
  className,
}: PhotoUploadProps) {
  const { tenantId } = useTenant();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido (use JPEG, PNG, WebP ou GIF)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande (máximo 5MB)');
        return;
      }

      setError(null);
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // Convert to base64
        const base64 = await fileToBase64(file);

        // Upload to server
        const response = await fetch(buildApiUrl('/api/upload', tenantId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId || '',
          },
          body: JSON.stringify({
            image: base64,
            entityType: 'member',
            entityId: memberId,
            filename: file.name,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao fazer upload');
        }

        const data = await response.json();

        if (onUploadComplete) {
          onUploadComplete(data.url);
        }

        // Clear preview after successful upload
        setPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [memberId, tenantId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayUrl = preview || currentPhotoUrl || null;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'relative cursor-pointer group',
          sizeClasses[size]
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className={cn('h-full w-full border-2 border-dashed border-muted-foreground/25 group-hover:border-primary transition-colors', sizeClasses[size])}>
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt="Foto do membro" />
          ) : null}
          <AvatarFallback className="bg-muted">
            {uploading ? (
              <div className="animate-pulse">...</div>
            ) : (
              <Camera className="h-1/2 w-1/2 text-muted-foreground" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Upload className="h-6 w-6 text-white" />
        </div>

        {/* Remove button */}
        {currentPhotoUrl && (
          <button
            type="button"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              if (onUploadComplete) {
                onUploadComplete('');
              }
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
        disabled={uploading}
      />

      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Enviando...' : 'Enviar foto'}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, WebP ou GIF (máx. 5MB)
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
