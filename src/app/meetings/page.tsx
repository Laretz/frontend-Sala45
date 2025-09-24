"use client"

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Meeting, Room, CreateMeetingData } from "@/types";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MeetingsPage() {
  const { isAuthenticated } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateMeetingData>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    roomId: ""
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      const [meetingsResponse, roomsResponse] = await Promise.all([
        api.getMeetings(),
        api.getRooms()
      ]);

      if (meetingsResponse.data) {
        setMeetings(meetingsResponse.data);
      }

      if (roomsResponse.data) {
        setRooms(roomsResponse.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Horários disponíveis (de 8h às 18h, blocos de 1 hora)
  const availableTimeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && time) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startDateTime = `${dateStr}T${time}:00`;
      const endDateTime = `${dateStr}T${String(parseInt(time.split(':')[0]) + 1).padStart(2, '0')}:00:00`;
      setFormData({
        ...formData,
        startTime: startDateTime,
        endTime: endDateTime
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && selectedTime) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const startDateTime = `${dateStr}T${selectedTime}:00`;
      const endDateTime = `${dateStr}T${String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:00:00`;
      setFormData({
        ...formData,
        startTime: startDateTime,
        endTime: endDateTime
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!selectedDate || !selectedTime) {
      setError("Por favor, selecione uma data e horário");
      setSubmitting(false);
      return;
    }

    // Verificar se o usuário já tem uma reserva em aberto (futuro)
    const now = new Date();
    const hasActiveBooking = meetings.some(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate > now;
    });

    if (hasActiveBooking) {
      setError("Você já possui uma reserva em aberto. Cancele a reserva atual para criar uma nova.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.createMeeting(formData);
      if (response.data && !response.error) {
        setMeetings([...meetings, response.data]);
        setFormData({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          roomId: ""
        });
        setSelectedDate(undefined);
        setSelectedTime("");
        setShowCreateForm(false);
      } else {
        setError(response.error || "Erro ao criar reserva");
      }
    } catch (error) {
      setError("Erro ao criar reserva");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reserva?")) {
      return;
    }

    try {
      const response = await api.deleteMeeting(meetingId);
      if (!response.error) {
        setMeetings(meetings.filter(m => m.id !== meetingId));
      } else {
        setError(response.error || "Erro ao excluir reserva");
      }
    } catch (error) {
      setError("Erro ao excluir reserva");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const sortedMeetings = meetings.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reservas</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Gerencie suas reservas de reuniões</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
            Nova Reserva
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Formulário de Criação */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nova Reserva</CardTitle>
            <CardDescription>
              Preencha os dados para criar uma nova reserva
            </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Título</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Título da reunião"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomId" className="text-sm font-medium">Sala</Label>
                    <select
                      id="roomId"
                      value={formData.roomId}
                      onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Selecione uma sala</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} (Capacidade: {room.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Descrição da reunião..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium">Horário (1 hora de duração)</Label>
                    <select
                      id="time"
                      value={selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Selecione um horário</option>
                      {availableTimeSlots.map((time) => {
                        const endTime = String(parseInt(time.split(':')[0]) + 1).padStart(2, '0') + ':00';
                        return (
                          <option key={time} value={time}>
                            {time} às {endTime}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                {selectedDate && selectedTime && (
                  <div className="p-4 bg-muted rounded-md border">
                    <p className="text-sm font-medium">
                      <strong>Reserva:</strong> {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} das {selectedTime} às {String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:00
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Criando..." : "Criar Reserva"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Reservas */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando reservas...</p>
          </div>
        ) : sortedMeetings.length > 0 ? (
          <div className="grid gap-4">
            {sortedMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2 break-words">{meeting.title}</h3>
                      {meeting.description && (
                        <p className="text-muted-foreground mb-3 break-words">{meeting.description}</p>
                      )}
                      <div className="space-y-1 text-sm">
                        <p className="flex flex-col sm:flex-row sm:gap-2">
                          <strong className="min-w-0">Início:</strong> 
                          <span className="break-all">{new Date(meeting.startTime).toLocaleString('pt-BR')}</span>
                        </p>
                        <p className="flex flex-col sm:flex-row sm:gap-2">
                          <strong className="min-w-0">Fim:</strong> 
                          <span className="break-all">{new Date(meeting.endTime).toLocaleString('pt-BR')}</span>
                        </p>
                        {meeting.room && (
                          <p className="flex flex-col sm:flex-row sm:gap-2">
                            <strong className="min-w-0">Sala:</strong> 
                            <span className="break-words">{meeting.room.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end sm:justify-start">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(meeting.id)}
                        className="w-full sm:w-auto"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhuma reserva encontrada</p>
              <Button onClick={() => setShowCreateForm(true)}>
                Criar Primeira Reserva
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}