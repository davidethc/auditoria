'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Plus, X, UserPlus, Send } from 'lucide-react';
import type { AuditoriaParticipante, RolParticipante, EstadoParticipacion } from '@/types/auditorias';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface ParticipantesFormProps {
  auditoriaId: string;
  participantes: AuditoriaParticipante[];
  onSuccess: () => void;
  readOnly?: boolean;
  currentUserId?: string; // ID del usuario actual para filtrar cuando es auditado
}

const rolesParticipante: { value: RolParticipante; label: string }[] = [
  { value: 'AUDITADO', label: 'Auditado' },
  { value: 'OBSERVADOR', label: 'Observador' },
  { value: 'APOYO', label: 'Apoyo' },
];

const estadosParticipacion: Record<EstadoParticipacion, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'outline' },
  NOTIFICADO: { label: 'Notificado', variant: 'secondary' },
  ACEPTADO: { label: 'Aceptado', variant: 'default' },
  RECHAZADO: { label: 'Rechazado', variant: 'destructive' },
};

export function ParticipantesForm({
  auditoriaId,
  participantes,
  onSuccess,
  readOnly = false,
  currentUserId,
}: ParticipantesFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRol, setSelectedRol] = useState<RolParticipante>('AUDITADO');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo cargar usuarios si NO es readOnly (auditados no necesitan ver la lista completa)
  useEffect(() => {
    if (!readOnly) {
      loadUsers();
    }
  }, [readOnly]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('role', ['auditado', 'auditor', 'auditor_interno'])
        .order('full_name', { ascending: true });

      if (error) {
        console.error('❌ Error cargando usuarios:', error);
        throw error;
      }
      
      console.log('✅ Usuarios cargados:', data?.length || 0, 'usuarios');
      console.log('📋 Usuarios:', data);
      setUsers(data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const handleAddParticipante = async () => {
    if (!selectedUserId) {
      setError('Selecciona un usuario');
      return;
    }

    // Verificar que no esté ya agregado
    if (participantes.some(p => p.user_id === selectedUserId)) {
      setError('Este usuario ya es participante');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const { error: insertError } = await supabase
        .from('auditoria_participantes')
        .insert({
          auditoria_id: auditoriaId,
          user_id: selectedUserId,
          rol_en_auditoria: selectedRol,
          estado_participacion: 'PENDIENTE',
          notificado_por: session.user.id,
        });

      if (insertError) throw insertError;

      setSelectedUserId('');
      setSelectedRol('AUDITADO');
      onSuccess();
    } catch (err) {
      console.error('Error agregando participante:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al agregar participante'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveParticipante = async (participanteId: string) => {
    if (!confirm('¿Estás seguro de eliminar este participante?')) return;

    try {
      const { error } = await supabase
        .from('auditoria_participantes')
        .delete()
        .eq('id', participanteId);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error('Error eliminando participante:', err);
      setError('Error al eliminar participante');
    }
  };

  const handleNotificarParticipante = async (participanteId: string) => {
    try {
      const { error } = await supabase
        .from('auditoria_participantes')
        .update({
          estado_participacion: 'NOTIFICADO',
          fecha_notificacion: new Date().toISOString(),
        })
        .eq('id', participanteId);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error('Error notificando participante:', err);
      setError('Error al notificar participante');
    }
  };

  // Filtrar usuarios disponibles (no participantes)
  const availableUsers = users.filter(
    user => !participantes.some(p => p.user_id === user.id)
  );

  // Si es readOnly y hay currentUserId, filtrar solo la participación del usuario actual
  const participantesAMostrar = readOnly && currentUserId
    ? participantes.filter(p => p.user_id === currentUserId)
    : participantes;

  return (
    <div className="space-y-6">
      {/* Formulario para agregar participantes */}
      {!readOnly && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Participante
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="user" className="text-sm font-medium">
                Usuario
              </label>
              <select
                id="user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isAdding}
              >
                <option value="">Seleccionar usuario...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="rol" className="text-sm font-medium">
                Rol
              </label>
              <select
                id="rol"
                value={selectedRol}
                onChange={(e) => setSelectedRol(e.target.value as RolParticipante)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isAdding}
              >
                {rolesParticipante.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={handleAddParticipante}
            disabled={isAdding || !selectedUserId}
            className="gap-2"
          >
            {isAdding ? (
              <>
                <Loader variant="cube" size={16} />
                Agregando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Agregar Participante
              </>
            )}
          </Button>
        </div>
      )}

      {/* Lista de participantes */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {readOnly && currentUserId ? 'Mi Participación' : `Participantes (${participantesAMostrar.length})`}
        </h3>

        {participantesAMostrar.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {readOnly && currentUserId 
              ? 'No estás participando en esta auditoría'
              : 'No hay participantes agregados aún'
            }
          </div>
        ) : (
          <div className="space-y-3">
            {participantesAMostrar.map((participante) => {
              const user = participante.user as {
                id: string;
                full_name: string | null;
                email: string;
                role: string;
              } | undefined;
              const estadoConfig = estadosParticipacion[participante.estado_participacion];

              return (
                <div
                  key={participante.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{user?.full_name || user?.email}</p>
                      <Badge variant="outline">{participante.rol_en_auditoria}</Badge>
                      <Badge variant={estadoConfig.variant}>
                        {estadoConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!readOnly && participante.estado_participacion === 'PENDIENTE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNotificarParticipante(participante.id)}
                        className="gap-2"
                      >
                        <Send className="h-3 w-3" />
                        Notificar
                      </Button>
                    )}
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveParticipante(participante.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

