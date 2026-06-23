'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mockReservations = [
  { id: '1', space: 'Quadra A', member: 'Maria Oliveira', time: '08:00 - 10:00', status: 'confirmada' },
  { id: '2', space: 'Salão', member: 'Carlos Santos', time: '10:00 - 12:00', status: 'confirmada' },
  { id: '3', space: 'Quadra B', member: 'Ana Costa', time: '14:00 - 16:00', status: 'pendente' },
  { id: '4', space: 'Churrasqueira', member: 'João Silva', time: '12:00 - 18:00', status: 'confirmada' },
  { id: '5', space: 'Sala de Jogos', member: 'Pedro Mendes', time: '19:00 - 22:00', status: 'confirmada' },
  { id: '6', space: 'Piscina', member: 'Juliana Ferreira', time: '06:00 - 08:00', status: 'confirmada' },
];

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

const spaces = ['Quadra A', 'Quadra B', 'Salão', 'Sala de Jogos', 'Churrasqueira', 'Piscina'];

const statusColors = {
  confirmada: 'bg-blue-500',
  pendente: 'bg-yellow-500',
  cancelada: 'bg-gray-400',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 23)); // June 23, 2026

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, currentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date(2026, 5, 23);
    return date.toDateString() === today.toDateString();
  };

  const getReservationsForDate = (day: number) => {
    // Simulate some reservations
    if (day === 23) return mockReservations;
    if (day === 24) return [mockReservations[0], mockReservations[3]];
    if (day === 25) return [mockReservations[4]];
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário de Reservas</h1>
          <p className="text-muted-foreground">Visualize todas as reservas do mês</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(2026, 5, 23))}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-40 text-center font-medium capitalize">{monthName}</span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const reservations = getReservationsForDate(day.date.getDate());
                return (
                  <div
                    key={index}
                    className={`min-h-24 rounded-lg border p-1 transition-colors ${
                      day.currentMonth ? 'bg-background' : 'bg-muted/30'
                    } ${isToday(day.date) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className={`text-sm p-1 ${day.currentMonth ? '' : 'text-muted-foreground'}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {reservations.slice(0, 3).map((res) => (
                        <div
                          key={res.id}
                          className={`text-xs px-1 py-0.5 rounded truncate text-white ${statusColors[res.status as keyof typeof statusColors]}`}
                        >
                          {res.time.split(' - ')[0]} {res.space}
                        </div>
                      ))}
                      {reservations.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{reservations.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reservas do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReservations.map((res) => (
                <div key={res.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {res.space}
                      </Badge>
                      <Badge className={
                        res.status === 'confirmada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {res.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{res.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{res.member}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
