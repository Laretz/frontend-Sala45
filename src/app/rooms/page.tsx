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
import { Room, CreateRoomData, Meeting } from "@/types";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const { isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateRoomData>({
    name: "",
    description: "",
    capacity: 0,
    location: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomMeetings, setRoomMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    loadRooms();
  }, [isAuthenticated, router]);

  const loadRooms = async () => {
    try {
      const response = await api.getRooms();
      if (response.data) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar salas:", error);
      setError("Erro ao carregar salas");
    } finally {
      setLoading(false);
    }
  };

  const loadRoomMeetings = async (roomId: string, date: Date) => {
    setLoadingMeetings(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.getRoomMeetings(roomId, dateStr);
      if (response.data && !response.error) {
        setRoomMeetings(response.data);
      } else {
        setRoomMeetings([]);
      }
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
      setRoomMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const isOccupied = roomMeetings.some(meeting => {
        const meetingStart = new Date(meeting.startTime);
        const meetingHour = meetingStart.getHours();
        return meetingHour === hour;
      });
      
      const occupiedMeeting = roomMeetings.find(meeting => {
        const meetingStart = new Date(meeting.startTime);
        const meetingHour = meetingStart.getHours();
        return meetingHour === hour;
      });
      
      slots.push({
        time: timeStr,
        isOccupied,
        meeting: occupiedMeeting
      });
    }
    return slots;
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    loadRoomMeetings(room.id, selectedDate);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (selectedRoom) {
        loadRoomMeetings(selectedRoom.id, date);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await api.createRoom(formData);
      if (response.success && response.data) {
        setRooms([...rooms, response.data]);
        setFormData({
          name: "",
          description: "",
          capacity: 0,
          location: ""
        });
        setShowCreateForm(false);
      } else {
        setError(response.error || "Erro ao criar sala");
      }
    } catch (error) {
      setError("Erro ao criar sala");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sala?")) {
      return;
    }

    try {
      const response = await api.deleteRoom(roomId);
      if (response.success) {
        setRooms(rooms.filter(r => r.id !== roomId));
      } else {
        setError(response.error || "Erro ao excluir sala");
      }
    } catch (error) {
      setError("Erro ao excluir sala");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Salas</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Gerencie as salas disponíveis para reserva</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
            Nova Sala
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Formulário de Criação */}
        {showCreateForm && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Nova Sala</CardTitle>
              <CardDescription className="text-sm">
                Preencha os dados para cadastrar uma nova sala
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Nome da Sala</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Sala de Reuniões A"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity" className="text-sm font-medium">Capacidade</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity || ""}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                      placeholder="Ex: 10"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location" className="text-sm font-medium">Localização</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Ex: 2º Andar, Ala Norte"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1 resize-none"
                    placeholder="Descrição da sala, equipamentos disponíveis, etc..."
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? "Criando..." : "Criar Sala"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Salas */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando salas...</p>
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedRoom?.id === room.id && "ring-2 ring-primary"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-lg">{room.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {room.capacity} pessoas
                    </span>
                  </CardTitle>
                  {room.location && (
                    <CardDescription className="text-sm">{room.location}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {room.description && (
                    <p className="text-sm text-muted-foreground mb-4 break-words">
                      {room.description}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="text-sm text-muted-foreground">
                        Capacidade: {room.capacity}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRoomSelect(room)}
                        className="w-full sm:w-auto"
                      >
                        Ver Horários
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(room.id)}
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
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground mb-4">Nenhuma sala cadastrada</p>
              <Button onClick={() => setShowCreateForm(true)}>
                Cadastrar Primeira Sala
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Visualização de Horários */}
        {selectedRoom && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Horários - {selectedRoom.name}
              </CardTitle>
              <CardDescription>
                Visualize os horários disponíveis e ocupados para esta sala
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de Data */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Selecionar Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Grade de Horários */}
              {loadingMeetings ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando horários...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Horários do Dia</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {generateTimeSlots().map((slot) => (
                      <div
                        key={slot.time}
                        className={cn(
                          "p-3 rounded-lg border text-center transition-colors",
                          slot.isOccupied
                            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                            : "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
                        )}
                      >
                        <div className="font-medium">{slot.time}</div>
                        <div className="text-xs mt-1">
                          {slot.isOccupied ? "Ocupado" : "Livre"}
                        </div>
                        {slot.meeting && (
                          <div className="text-xs mt-1 truncate" title={slot.meeting.title}>
                            {slot.meeting.title}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Legenda */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
                      <span className="text-sm text-muted-foreground">Horário Livre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
                      <span className="text-sm text-muted-foreground">Horário Ocupado</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}