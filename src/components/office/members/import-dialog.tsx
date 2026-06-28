'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Download } from 'lucide-react';
import { useTenant, buildApiUrl } from '@/lib/context/tenant-context';
import { cn } from '@/lib/utils';

interface ImportResult {
  imported: number;
  errors: number;
  duplicates: number;
  details: {
    success: number;
    errors: Array<{ row: number; data: Record<string, string>; error: string }>;
    duplicates: Array<{ row: number; cpf: string; name: string }>;
  };
}

interface ImportDialogProps {
  onImportComplete?: () => void;
}

export function ImportMembersDialog({ onImportComplete }: ImportDialogProps) {
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setError(null);
    setResult(null);
    setImporting(false);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetState, 200);
    }
  };

  const handleFile = useCallback((selectedFile: File) => {
    const allowedExtensions = ['.csv'];
    const hasValidExtension = allowedExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      setError('Apenas arquivos CSV são permitidos');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('Arquivo muito grande (máximo 5MB)');
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file || !tenantId) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildApiUrl('/api/members/import', tenantId), {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar membros');
      }

      setResult(data);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar membros');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'nome',
      'cpf',
      'data_nascimento',
      'email',
      'telefone_movel',
      'telefone_residencial',
      'tipo',
      'logradouro',
      'numero',
      'bairro',
      'cidade',
      'estado',
      'cep',
      'local_trabalho',
      'matricula',
      'data_admissao',
      'cargo',
    ];
    const exampleRow = [
      'João Silva',
      '12345678901',
      '15/03/1985',
      'joao@email.com',
      '11999999999',
      '1133333333',
      'afiliado',
      'Rua das Flores',
      '100',
      'Centro',
      'São Paulo',
      'SP',
      '01234567',
      'Secretaria de Educação',
      'MAT001',
      '01/01/2020',
      'Professor',
    ];

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_associados.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasResults = result !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <Upload className="mr-2 h-4 w-4" />
        Importar CSV
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Associados</DialogTitle>
          <DialogDescription>
            Importe membros de um arquivo CSV. Baixe o modelo para ver o formato esperado.
          </DialogDescription>
        </DialogHeader>

        {!hasResults ? (
          <div className="space-y-4">
            {/* Template download */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Modelo de importação</p>
                  <p className="text-sm text-muted-foreground">
                    CSV com colunas esperadas
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar modelo
              </Button>
            </div>

            {/* Drop zone */}
            <div
              className={cn(
                'relative rounded-lg border-2 border-dashed p-8 transition-colors',
                dragging
                  ? 'border-primary bg-primary/5'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-muted-foreground/25 hover:border-primary/50',
                'cursor-pointer'
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragging(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFile(selectedFile);
                }}
              />
              <div className="flex flex-col items-center gap-3 text-center">
                {file ? (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-green-600" />
                    <div>
                      <p className="font-medium text-green-700">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB — Clique para trocar
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Arraste e solte seu arquivo CSV aqui
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ou clique para selecionar
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* CSV format info */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Formato esperado do CSV:</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  <code className="bg-muted px-1 rounded">nome</code> *
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">cpf</code> * (11 dígitos)
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">data_nascimento</code> *
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">email</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">telefone_movel</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">telefone_residencial</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">tipo</code> (afiliado/convidado/dependente_maior)
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">logradouro</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">numero</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">bairro</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">cidade</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">estado</code> (2 letras)
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">cep</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">local_trabalho</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">matricula</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">data_admissao</code>
                </span>
                <span>
                  <code className="bg-muted px-1 rounded">cargo</code>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Campos obrigatórios. Data no formato DD/MM/AAAA.
                Máximo 500 registros por importação.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-green-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                <p className="text-sm text-green-600">Importados</p>
              </div>
              <div className="rounded-lg border bg-yellow-50 p-4 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-700">{result.duplicates}</p>
                <p className="text-sm text-yellow-600">Duplicados</p>
              </div>
              <div className="rounded-lg border bg-red-50 p-4 text-center">
                <X className="mx-auto h-8 w-8 text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                <p className="text-sm text-red-600">Erros</p>
              </div>
            </div>

            {/* Duplicates */}
            {result.details.duplicates.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Registros duplicados (CPF já existente)
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.details.duplicates.map((d, i) => (
                    <div key={i} className="text-sm text-yellow-700">
                      Linha {d.row}: {d.name} ({d.cpf})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.details.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Erros de validação
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.details.errors.map((e, i) => (
                    <div key={i} className="text-sm text-red-700">
                      <span className="font-medium">Linha {e.row}:</span> {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.imported > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-green-600 mb-1" />
                <p className="font-medium text-green-700">
                  {result.imported} associado{result.imported !== 1 ? 's' : ''} importado
                  {result.imported !== 1 ? 's' : ''} com sucesso!
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!hasResults ? (
            <>
              <DialogClose>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? 'Importando...' : 'Importar'}
              </Button>
            </>
          ) : (
            <>
              <DialogClose>
                <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
              </DialogClose>
              <Button onClick={resetState} variant="outline">
                Importar mais
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
