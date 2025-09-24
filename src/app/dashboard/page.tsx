"use client"

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Meeting, Room } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const todayMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.startTime);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  });

  const upcomingMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.startTime);
    const now = new Date();
    return meetingDate > now;
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Bem-vindo de volta, {user?.name}!</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Hoje</CardTitle>
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMeetings.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayMeetings.length === 1 ? "reserva" : "reservas"} para hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
              <p className="text-xs text-muted-foreground">
                {meetings.length === 1 ? "reserva" : "reservas"} no total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salas Disponíveis</CardTitle>
              <svg
                className="h-4 w-4 text-muted-foreground"
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
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <p className="text-xs text-muted-foreground">
                {rooms.length === 1 ? "sala" : "salas"} cadastradas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Próximas Reservas */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reservas</CardTitle>
              <CardDescription>
                Seus próximos compromissos agendados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : upcomingMeetings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center space-x-3 sm:space-x-4 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium break-words">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground break-all">
                          {new Date(meeting.startTime).toLocaleString('pt-BR')}
                        </p>
                        {meeting.room && (
                          <p className="text-xs text-muted-foreground break-words">
                            Sala: {meeting.room.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link href="/meetings">
                    <Button variant="outline" className="w-full">
                      Ver todas as reservas
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Nenhuma reserva próxima</p>
                  <Link href="/meetings">
                    <Button>Criar Reserva</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <Link href="/meetings">
                  <Button className="w-full justify-start" variant="outline">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Nova Reserva
                  </Button>
                </Link>
                
                <Link href="/rooms">
                  <Button className="w-full justify-start" variant="outline">
                    <svg
                      className="mr-2 h-4 w-4"
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
                    Gerenciar Salas
                  </Button>
                </Link>
                
                <Link href="/meetings">
                  <Button className="w-full justify-start" variant="outline">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Ver Calendário
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}