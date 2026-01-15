'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Save, Calendar } from 'lucide-react';
import { agregarDiasHabiles } from '@/utils/auditoriaHelpers';
import type { AuditoriaInforme } from '@/types/auditorias';

interface EstrategiaFormProps {
  informe: AuditoriaInforme;
  onSuccess: () => void;
  currentUserId: string;
  readOnly?: boolean;
}

export function EstrategiaForm({
  informe,
  onSuccess,
  currentUserId,
  readOnly = false,
}: EstrategiaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estrategia, setEstrategia] = useState(informe.estrategia || '');
  const [fechaInicio, setFechaInicio] = useState(informe.fecha_inicio_implementacion || '');
  const [fechaFin, setFechaFin] = useState(informe.fecha_fin_implementacion || '');
  const [entregable, setEntregable] = useState(informe.entregable || '');
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);

  useEffect(() => {
    calcularDiasRestantes();
  }, []);

  const calcularDiasRestantes = () => {
    if (!informe.fecha_socializacion) return;

    const fechaSocializacion = new Date(informe.fecha_socializacion);
    const fechaLimite = agregarDiasHabiles(fechaSocializacion, 3);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaLimite.setHours(0, 0, 0, 0);

    const diff = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    setDiasRestantes(diff);
  };

  const handleGuardar = async () => {
    if (!estrategia.trim()) {
      setError('La estrategia es obligatoria');
      return;
    }

    if (!fechaInicio) {
      setError('La fecha de inicio es obligatoria');
      return;
    }

    if (!fechaFin) {
      setError('La fecha de fin es obligatoria');
      return;
    }

    if (!entregable.trim()) {
      setError('El entregable es obligatorio');
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('auditoria_informe')
        .update({
          estrategia: estrategia.trim(),
          fecha_inicio_implementacion: fechaInicio,
          fecha_fin_implementacion: fechaFin,
          entregable: entregable.trim(),
        })
        .eq('id', informe.id);

      if (updateError) throw updateError;

      // NOTIFICAR AL AUDITOR sobre las fechas de implementación asignadas
      // IMPORTANTE: Notificar por CADA observación individual
      try {
        const { data: auditoriaData } = await supabase
          .from('auditorias')
          .select('id, auditor_responsable_id')
          .eq('id', informe.auditoria_id)
          .maybeSingle();

        if (auditoriaData?.auditor_responsable_id) {
          const { data: observacionesData } = await supabase
            .from('auditoria_observaciones')
            .select('id, numero_observacion, titulo_observacion, descripcion_observacion, responsable_implementacion')
            .eq('auditoria_id', informe.auditoria_id);

          // Obtener observaciones donde el usuario actual es responsable
          const observacionesUsuario = observacionesData?.filter(
            obs => obs.responsable_implementacion === currentUserId
          ) || [];

          if (observacionesUsuario.length > 0) {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: currentUserData } = await supabase
              .from('users')
              .select('full_name, email')
              .eq('id', currentUserId)
              .maybeSingle();

            // Obtener datos del auditor
            const { data: auditorData } = await supabase
              .from('users')
              .select('id, email, full_name')
              .eq('id', auditoriaData.auditor_responsable_id)
              .maybeSingle();

            // NOTIFICAR POR CADA OBSERVACIÓN INDIVIDUAL
            for (const observacion of observacionesUsuario) {
              // Crear comunicación en BD
              await supabase
                .from('comunicaciones_auditado')
                .insert({
                  auditoria_id: informe.auditoria_id,
                  destinatario_id: auditoriaData.auditor_responsable_id,
                  tipo_comunicacion: 'NOTIFICACION',
                  asunto: `Fechas de implementación asignadas - Observación #${observacion.numero_observacion}`,
                  mensaje: `El auditado ${currentUserData?.full_name || currentUserData?.email || 'Usuario'} ha asignado fechas de implementación para la siguiente observación:\n\nOBSERVACIÓN #${observacion.numero_observacion}\nTítulo: ${observacion.titulo_observacion}\nDescripción: ${observacion.descripcion_observacion}\n\nFECHA DE INICIO: ${new Date(fechaInicio).toLocaleDateString('es-ES')}\nFECHA DE FIN: ${new Date(fechaFin).toLocaleDateString('es-ES')}\n\nEstrategia:\n${estrategia}\n\nEntregable: ${entregable}`,
                  metodo_envio: 'SISTEMA',
                  enviado_por: session?.user.id || null,
                  confirmado: false,
                });

              // NOTIFICAR AL AUDITOR (el auditado le informa que asignó fechas)
              if (auditorData?.email) {
                fetch('/api/notificar-auditor-fechas-implementacion', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    observacion_id: observacion.id,
                    auditoria_id: informe.auditoria_id,
                    auditor_id: auditoriaData.auditor_responsable_id,
                    auditor_email: auditorData.email,
                    auditor_nombre: auditorData.full_name || auditorData.email,
                    observacion_numero: observacion.numero_observacion,
                    observacion_titulo: observacion.titulo_observacion,
                    observacion_descripcion: observacion.descripcion_observacion,
                    fecha_inicio,
                    fecha_fin,
                    estrategia,
                    entregable,
                    auditado_nombre: currentUserData?.full_name || currentUserData?.email || 'Usuario',
                    auditado_email: currentUserData?.email || null,
                  }),
                }).catch((error) => {
                  console.error('Error llamando webhook N8N al auditor (no crítico):', error);
                });
              }

              // NOTIFICAR AL AUDITADO (confirmación de fechas asignadas)
              if (currentUserData?.email) {
                fetch('/api/notificar-auditado-fechas-asignadas', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    observacion_id: observacion.id,
                    auditoria_id: informe.auditoria_id,
                    auditado_id: currentUserId,
                    auditado_email: currentUserData.email,
                    auditado_nombre: currentUserData.full_name || currentUserData.email,
                    observacion_numero: observacion.numero_observacion,
                    observacion_titulo: observacion.titulo_observacion,
                    observacion_descripcion: observacion.descripcion_observacion,
                    fecha_inicio,
                    fecha_fin,
                    estrategia,
                    entregable,
                  }),
                }).catch((error) => {
                  console.error('Error llamando webhook N8N al auditado (no crítico):', error);
                });
              }
            }
          }
        }
      } catch (notifError) {
        console.error('Error notificando al auditor (no crítico):', notifError);
        // No lanzar error, solo loguear
      }

      // Verificar si todos los auditados han respondido
      // (esto se puede hacer verificando si todos los participantes han completado)
      // Por ahora, solo actualizamos el informe

      onSuccess();
      alert('✅ Estrategia guardada exitosamente. El auditor ha sido notificado de las fechas asignadas.');
    } catch (err) {
      console.error('Error guardando estrategia:', err);
      setError('Error al guardar la estrategia');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Completar Estrategia de Implementación</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Define la estrategia, fechas y entregables para implementar las recomendaciones
            </p>
          </div>
          {diasRestantes !== null && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              diasRestantes < 0
                ? 'bg-destructive/10 text-destructive'
                : diasRestantes <= 1
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {diasRestantes < 0
                ? 'Vencido'
                : `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`
              }
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {diasRestantes !== null && diasRestantes < 0 && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ El plazo de 3 días hábiles ha vencido. Por favor, completa la estrategia lo antes posible.
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Estrategia de Implementación *
          </label>
          <textarea
            value={estrategia}
            onChange={(e) => setEstrategia(e.target.value)}
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe la estrategia que se implementará para corregir las observaciones..."
            required
            disabled={isSaving || readOnly}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de Inicio de Implementación *
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={isSaving || readOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de Fin de Implementación *
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={isSaving || readOnly}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Entregable *
          </label>
          <input
            type="text"
            value={entregable}
            onChange={(e) => setEntregable(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ej: Base de datos actualizada con controles implementados"
            required
            disabled={isSaving || readOnly}
          />
        </div>

        {!readOnly && (
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader variant="cube" size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Estrategia
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

