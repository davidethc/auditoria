'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Users, Calendar } from 'lucide-react';
import type { AuditoriaInforme, AuditoriaParticipante } from '@/types/auditorias';

interface SocializacionInformeProps {
  informe: AuditoriaInforme;
  participantes: AuditoriaParticipante[];
  onSuccess: () => void;
}

export function SocializacionInforme({
  informe,
  participantes,
  onSuccess,
}: SocializacionInformeProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaSocializacion, setFechaSocializacion] = useState('');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);

  const handleGuardar = async () => {
    if (!fechaSocializacion) {
      setError('Debes seleccionar la fecha de socialización');
      return;
    }

    if (participantesSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un participante');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const nombresParticipantes = participantes
        .filter(p => participantesSeleccionados.includes(p.user_id))
        .map(p => p.user?.full_name || p.user?.email || 'Usuario')
        .filter(Boolean);

      const { error: updateError } = await supabase
        .from('auditoria_informe')
        .update({
          estado: 'SOCIALIZADO',
          fecha_socializacion: new Date(fechaSocializacion).toISOString(),
          participantes_socializacion: nombresParticipantes,
        })
        .eq('id', informe.id);

      if (updateError) throw updateError;

      // Actualizar auditoría
      await supabase
        .from('auditorias')
        .update({ informe_socializado: true, fecha_socializacion: new Date(fechaSocializacion).toISOString() })
        .eq('id', informe.auditoria_id);

      onSuccess();
      alert('✅ Socialización registrada exitosamente');
    } catch (err) {
      console.error('Error guardando socialización:', err);
      setError('Error al guardar la socialización');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnviarAAuditados = async () => {
    if (!confirm('¿Estás seguro de enviar el informe a los auditados? Ellos podrán completar la estrategia y fechas de implementación.')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Cambiar estado del informe a ENVIADO_A_AUDITADOS
      const { error: updateError } = await supabase
        .from('auditoria_informe')
        .update({
          estado: 'ENVIADO_A_AUDITADOS',
        })
        .eq('id', informe.id);

      if (updateError) throw updateError;

      // Actualizar auditoría
      await supabase
        .from('auditorias')
        .update({ 
          informe_final_enviado: true, 
          fecha_informe_final: new Date().toISOString() 
        })
        .eq('id', informe.auditoria_id);

      // Actualizar observaciones incluidas en el informe
      if (informe.observaciones_enumeradas && Array.isArray(informe.observaciones_enumeradas)) {
        const observacionIds = informe.observaciones_enumeradas
          .map((obs: { id?: string }) => obs.id)
          .filter(Boolean);

        if (observacionIds.length > 0) {
          const fechaActual = new Date().toISOString().split('T')[0];
          
          // Actualizar numero_informe, fecha_emision_informe y fecha_envio_informe
          await supabase
            .from('auditoria_observaciones')
            .update({
              numero_informe: informe.encabezado || null,
              fecha_emision_informe: informe.fecha_inicio_informe || fechaActual,
              fecha_envio_informe: fechaActual,
            })
            .in('id', observacionIds);
        }
      }

      onSuccess();
      alert('✅ Informe enviado a auditados exitosamente. Ahora pueden completar la estrategia y fechas.');
    } catch (err) {
      console.error('Error enviando a auditados:', err);
      setError('Error al enviar el informe a auditados');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleParticipante = (userId: string) => {
    setParticipantesSeleccionados(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Registrar Socialización del Informe</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Registra la fecha y participantes de la reunión de socialización
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fecha de Socialización *
          </label>
          <input
            type="datetime-local"
            value={fechaSocializacion}
            onChange={(e) => setFechaSocializacion(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participantes de la Socialización *
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
            {participantes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay participantes en esta auditoría</p>
            ) : (
              participantes.map((participante) => {
                const user = participante.user as { full_name: string | null; email: string } | undefined;
                const estaSeleccionado = participantesSeleccionados.includes(participante.user_id);

                return (
                  <label
                    key={participante.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      estaSeleccionado
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={estaSeleccionado}
                      onChange={() => toggleParticipante(participante.user_id)}
                      className="rounded border-gray-300"
                      disabled={isSaving}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {user?.full_name || user?.email || 'Usuario'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participante.rol_en_auditoria}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {participantesSeleccionados.length} participante{participantesSeleccionados.length !== 1 ? 's' : ''} seleccionado{participantesSeleccionados.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          {informe.estado === 'SOCIALIZADO' ? (
            <Button
              type="button"
              onClick={handleEnviarAAuditados}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader variant="cube" size={16} />
                  Enviando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Enviar a Auditados
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={isSaving || !fechaSocializacion || participantesSeleccionados.length === 0}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader variant="cube" size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Registrar Socialización
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

