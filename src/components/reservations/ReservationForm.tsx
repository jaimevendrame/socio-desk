'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useReservationFormSchema } from '@/lib/reservations/schema';
import { useAvailability } from '@/hooks/useAvailability';
import { useConflicts } from '@/hooks/useConflicts';
import { useMembers } from '@/hooks/useMembers';
import { useSpaces } from '@/hooks/useSpaces';
import { CalendarIcon, Clock, Users, MapPin, AlertTriangle } from 'lucide-react';

const recurringFormSchema = z.object({
  pattern: z.enum(['daily', 'weekly']).optional(),
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

interface ReservationFormProps {
  spaceId?: string;
  date?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ReservationForm({ spaceId, date, onSuccess, trigger }: ReservationFormProps) {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? parseISO(date) : new Date()
  );

  const reservationSchema = useReservationFormSchema();
  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      spaceId: spaceId || '',
      date: date || format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      isRecurring: false,
    },
  });

  const recurringForm = useForm<z.infer<typeof recurringFormSchema>>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      pattern: 'daily',
      until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    },
  });

  // Hooks para dados
  const { data: membersData, isLoading: membersLoading } = useMembers();
  const { data: spacesData, isLoading: spacesLoading } = useSpaces();
  const { slots, loading: availabilityLoading } = useAvailability({
    tenantId: '', // Será preenchido pelo contexto
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    spaceId: spaceId || undefined,
  });
  const { conflict, loading: conflictLoading, check: checkConflicts } = useConflicts();

  // Atualiza form quando date muda
  useEffect(() => {
    if (selectedDate) {
      form.setValue('date', format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, form]);

  // Atualiza disponibilidade quando space/date muda
  useEffect(() => {
    if (spaceId && selectedDate) {
      checkConflicts({
        spaceId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: form.getValues('startTime'),
        endTime: form.getValues('endTime'),
      });
    }
  }, [spaceId, selectedDate, form.getValues('startTime'), form.getValues('endTime')]);

  const onSubmit = async (data: z.infer<typeof reservationSchema>) => {
    try {
      // Validação adicional
      const startMinutes = parseInt(data.startTime.split(':')[0]);
      const endMinutes = parseInt(data.endTime.split(':')[0]);
      const duration = endMinutes - startMinutes;

      if (duration < 30) {
        form.setError('endTime', { message: 'Duração mínima é 30 minutos' });
        return;
      }

      // Se for recorrente, adiciona dados da recorrência
      const submitData = {
        ...data,
        isRecurring,
        recurringPattern: isRecurring ? recurringForm.getValues('pattern') : undefined,
        recurringUntil: isRecurring ? recurringForm.getValues('until') : undefined,
      };

      // Chamar API de criação
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao criar reserva');
      }

      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    form.setValue(field, value);
    checkConflicts({
      spaceId: form.getValues('spaceId'),
      date: form.getValues('date'),
      startTime: form.getValues('startTime'),
      endTime: form.getValues('endTime'),
    });
  };

  const selectedSpace = spacesData?.find(s => s.id === spaceId);
  const memberOptions = membersData?.filter(m => m.status === 'ativo');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Nova Reserva</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Reserva</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção de espaço */}
            <FormField
              control={form.control}
              name="spaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Espaço</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um espaço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {spacesData?.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {space.name}
                            <Badge variant="secondary" className="ml-2">
                              {space.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "P", { locale: ptBR }) : "Selecione uma data"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            field.onChange(format(date!, 'yyyy-MM-dd'));
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Membros */}
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membro</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um membro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {memberOptions?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {member.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Início
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={field.value}
                        onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Término
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={field.value}
                        onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conflitos */}
            {conflict?.hasConflict && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <strong>Conflito de horário detectado!</strong>
                </div>
                <ul className="space-y-1 text-sm text-red-700">
                  {conflict.conflictingReservations.map((res) => (
                    <li key={res.id}>
                      • {res.startTime} - {res.endTime} ({res.memberName})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reserva recorrente */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Reserva Recorrente</h4>
                <p className="text-sm text-gray-600">
                  Criar múltiplas reservas automaticamente
                </p>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                <FormField
                  control={recurringForm.control}
                  name="pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padrão</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={recurringForm.control}
                  name="until"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Até</FormLabel>
                      <Input
                        type="date"
                        value={field.value}
                        onChange={field.onChange}
                        min={format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações opcionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  conflict?.hasConflict ||
                  conflictLoading ||
                  membersLoading ||
                  spacesLoading ||
                  !form.getValues('spaceId') ||
                  !form.getValues('memberId')
                }
              >
                Criar Reserva
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
