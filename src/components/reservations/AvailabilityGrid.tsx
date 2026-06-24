'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MapPin, Check, X } from 'lucide-react';
import { reservationStatusColors } from '@/lib/design-system/domain-colors';

interface SpaceAvailability {
  id: string;
  name: string;
  category: string;
  openTime: string;
  closeTime: string;
  bufferMinutes: number;
  slots: Array<{
    start: string;
    end: string;
    available: boolean;
    reservation?: {
      id: string;
      memberId: string;
      memberName: string;
      status: 'pendente' | 'confirmada' | 'cancelada' | 'concluida';
    };
  }>;
}

interface AvailabilityGridProps {
  spaces: SpaceAvailability[];
  selectedSpaceId?: string;
  onSlotClick?: (spaceId: string, startTime: string, endTime: string) => void;
  className?: string;
}

export function AvailabilityGrid({
  spaces,
  selectedSpaceId,
  onSlotClick,
  className = '',
}: AvailabilityGridProps) {
  // Filtra por espaço se selecionado
  const filteredSpaces = useMemo(() => {
    if (selectedSpaceId) {
      return spaces.filter((s) => s.id === selectedSpaceId);
    }
    return spaces;
  }, [spaces, selectedSpaceId]);

  // Agrupa slots por horário
  const slotsByTime = useMemo(() => {
    const allSlots = filteredSpaces.flatMap((s) => s.slots);
    const uniqueTimes = [...new Set(allSlots.map((s) => s.start))].sort();

    return uniqueTimes.map((time) => ({
      time,
      spaces: filteredSpaces.map((space) => ({
        spaceId: space.id,
        spaceName: space.name,
        category: space.category,
        slot: space.slots.find((s) => s.start === time),
      })),
    }));
  }, [filteredSpaces]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Horários Disponíveis</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
            <span>Ocupado</span>
          </div>
        </div>
      </div>

      {/* Grid de horários */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {slotsByTime.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum horário disponível</p>
              <p className="text-sm">Selecione outra data ou espaço</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slotsByTime.map(({ time, spaces: timeSpaces }) => (
                <Card key={time} className="overflow-hidden">
                  {/* Header do horário */}
                  <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4" />
                      {time}
                    </div>
                    <Badge variant="secondary">
                      {timeSpaces.filter((s) => s.slot?.available).length} disponível(is)
                    </Badge>
                  </div>

                  {/* Espaços para este horário */}
                  <div className="divide-y">
                    {timeSpaces.map(({ spaceId, spaceName, category, slot }) => {
                      const isAvailable = slot?.available ?? false;
                      const status = slot?.reservation?.status;

                      return (
                        <button
                          key={spaceId}
                          className={`
                            w-full px-4 py-3 flex items-center justify-between
                            transition-colors text-left
                            ${isAvailable
                              ? 'hover:bg-green-50 cursor-pointer'
                              : 'bg-muted/30 cursor-not-allowed'
                            }
                          `}
                          onClick={() => {
                            if (isAvailable && slot) {
                              onSlotClick?.(spaceId, slot.start, slot.end);
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                ${isAvailable
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                                }
                              `}
                            >
                              {isAvailable ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{spaceName}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {category}
                              </div>
                            </div>
                          </div>

                          {slot?.reservation && (
                            <Badge
                              className={`
                                ${reservationStatusColors[status!]?.bg}
                                ${reservationStatusColors[status!]?.text}
                              `}
                            >
                              {slot.reservation.memberName}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
