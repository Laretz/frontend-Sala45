"use client"

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function ApprovalsPage() {
  const { isAuthenticated, user, loading: authLoading, isHydrated } = useAuth();
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("🔍 Approvals - Estado auth:", { authLoading, isAuthenticated, isHydrated, user: !!user });
    
    // Aguardar o carregamento do contexto de autenticação E a hidratação
    if (authLoading || !isHydrated) {
      console.log("⏳ Approvals - Aguardando carregamento...");
      return;
    }

    if (!isAuthenticated) {
      console.log("❌ Approvals - Não autenticado, redirecionando...");
      router.push("/login");
      return;
    }

    // Aguardar o carregamento do usuário
    if (!user) {
      console.log("⏳ Approvals - Aguardando dados do usuário...");
      return;
    }

    // Verificar se o usuário tem permissão (RH ou ADMIN)
    if (user.role !== 'RH' && user.role !== 'ADMIN') {
      console.log("❌ Approvals - Sem permissão, redirecionando...");
      router.push("/dashboard");
      return;
    }
    
    console.log("✅ Approvals - Carregando reuniões pendentes...");
    loadPendingMeetings();
  }, [authLoading, isAuthenticated, isHydrated, user, router]);

  const loadPendingMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.getPendingMeetings();
      
      if (response.data) {
        setPendingMeetings(response.data);
      } else {
        setError(response.error || "Erro ao carregar reuniões pendentes");
      }
    } catch (error) {
      console.error("Erro ao carregar reuniões pendentes:", error);
      setError("Erro ao carregar reuniões pendentes");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (meetingId: number, action: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessingId(String(meetingId));
      setError(null);
      
      const response = await api.approveMeeting(meetingId, action);
      
      if (!response.error) {
        // Remover a reunião da lista de pendentes
        setPendingMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
      } else {
        setError(response.error || "Erro ao processar aprovação");
      }
    } catch (error) {
      console.error("Erro ao processar aprovação:", error);
      setError("Erro ao processar aprovação");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated || (user?.role !== 'RH' && user?.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Aprovação de Reuniões</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Gerencie as solicitações de reuniões pendentes
            </p>
          </div>
          <Button onClick={loadPendingMeetings} variant="outline" className="w-full sm:w-auto">
            Atualizar Lista
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando reuniões pendentes...</p>
          </div>
        ) : pendingMeetings.length > 0 ? (
          <div className="grid gap-4">
            {pendingMeetings.map((meeting) => (
              <Card key={meeting.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold break-words">{meeting.title}</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                      </div>
                      
                      {meeting.description && (
                        <p className="text-muted-foreground mb-3 break-words">{meeting.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="flex flex-col sm:flex-row sm:gap-2">
                            <strong className="min-w-0">Início:</strong> 
                            <span className="break-all">{new Date(meeting.startTime).toLocaleString('pt-BR')}</span>
                          </p>
                          <p className="flex flex-col sm:flex-row sm:gap-2">
                            <strong className="min-w-0">Fim:</strong> 
                            <span className="break-all">{new Date(meeting.endTime).toLocaleString('pt-BR')}</span>
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          {meeting.duration && (
                            <p className="flex flex-col sm:flex-row sm:gap-2">
                              <strong className="min-w-0">Duração:</strong> 
                              <span className="break-words">
                                {meeting.duration === 30 ? '30 minutos' : 
                                 meeting.duration === 60 ? '1 hora' : 
                                 meeting.duration === 120 ? '2 horas' : 
                                 `${meeting.duration} minutos`}
                              </span>
                            </p>
                          )}
                          {meeting.room && (
                            <p className="flex flex-col sm:flex-row sm:gap-2">
                              <strong className="min-w-0">Sala:</strong> 
                              <span className="break-words">{meeting.room.name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                      <Button 
                        onClick={() => handleApproval(meeting.id, 'APPROVED')}
                        disabled={processingId === meeting.id}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {processingId === meeting.id ? "Processando..." : "Aprovar"}
                      </Button>
                      
                      <Button 
                        onClick={() => handleApproval(meeting.id, 'REJECTED')}
                        disabled={processingId === meeting.id}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        {processingId === meeting.id ? "Processando..." : "Rejeitar"}
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
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma reunião pendente</h3>
              <p className="text-muted-foreground mb-4">
                Todas as reuniões foram processadas ou não há solicitações pendentes no momento.
              </p>
              <Button onClick={loadPendingMeetings} variant="outline">
                Verificar Novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}