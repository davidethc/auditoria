'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Save, Upload, FileText } from 'lucide-react';
import type { AuditoriaObservacion } from '@/types/auditorias';

interface ReporteAvanceMensualProps {
  observacion: AuditoriaObservacion;
  auditoriaId: string;
  currentUserId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ReporteAvanceMensual({
  observacion,
  auditoriaId,
  currentUserId,
  onSuccess,
  onCancel,
}: ReporteAvanceMensualProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porcentajeAvance, setPorcentajeAvance] = useState(observacion.porcentaje_avance || 0);
  const [descripcionAvance, setDescripcionAvance] = useState(observacion.descripcion_avance || '');
  const [linkEvidencia, setLinkEvidencia] = useState('');

  const validarLinkDrive = (url: string): boolean => {
    if (!url.trim()) return true; // Opcional
    const drivePatterns = [
      /^https?:\/\/(drive\.google\.com|docs\.google\.com)/,
      /^https?:\/\/.*google.*drive/,
    ];
    return drivePatterns.some(pattern => pattern.test(url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (porcentajeAvance < 0 || porcentajeAvance > 100) {
      setError('El porcentaje de avance debe estar entre 0 y 100');
      return;
    }

    if (!descripcionAvance.trim()) {
      setError('La descripción del avance es obligatoria');
      return;
    }

    if (linkEvidencia.trim() && !validarLinkDrive(linkEvidencia.trim())) {
      setError('El link debe ser un enlace válido de Google Drive');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Actualizar observación con avance
      const { error: updateError } = await supabase
        .from('auditoria_observaciones')
        .update({
          porcentaje_avance: porcentajeAvance,
          descripcion_avance: descripcionAvance.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', observacion.id);

      if (updateError) throw updateError;

      // Si hay evidencia, crear registro
      if (linkEvidencia.trim()) {
        const { error: evidenciaError } = await supabase
          .from('observacion_evidencias')
          .insert({
            observacion_id: observacion.id,
            tipo_evidencia: 'EVIDENCIA',
            descripcion: `Avance mensual - ${porcentajeAvance}% - ${new Date().toLocaleDateString('es-ES')}`,
            archivo_url: linkEvidencia.trim(),
            subida_por: currentUserId,
          });

        if (evidenciaError) throw evidenciaError;
      }

      // Notificar al auditor sobre el avance
      try {
        const { data: auditoriaData } = await supabase
          .from('auditorias')
          .select('auditor_responsable_id')
          .eq('id', auditoriaId)
          .maybeSingle();

        if (auditoriaData?.auditor_responsable_id) {
          const { data: { session } } = await supabase.auth.getSession();
          const { data: currentUserData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', currentUserId)
            .maybeSingle();

          await supabase
            .from('comunicaciones_auditado')
            .insert({
              auditoria_id: auditoriaId,
              destinatario_id: auditoriaData.auditor_responsable_id,
              tipo_comunicacion: 'NOTIFICACION',
              asunto: `Reporte de avance mensual - Observación #${observacion.numero_observacion}`,
              mensaje: `El auditado ${currentUserData?.full_name || currentUserData?.email || 'Usuario'} ha reportado avance en la siguiente observación:\n\nOBSERVACIÓN #${observacion.numero_observacion}\nTítulo: ${observacion.titulo_observacion}\n\nPORCENTAJE DE AVANCE: ${porcentajeAvance}%\nDESCRIPCIÓN DEL AVANCE:\n${descripcionAvance.trim()}\n\n${linkEvidencia.trim() ? `EVIDENCIA: ${linkEvidencia.trim()}` : 'Sin evidencia adjunta'}`,
              metodo_envio: 'SISTEMA',
              enviado_por: session?.user.id || null,
              confirmado: false,
            });
        }
      } catch (notifError) {
        console.error('Error notificando al auditor (no crítico):', notifError);
      }

      onSuccess();
      alert('✅ Reporte de avance enviado exitosamente. El auditor ha sido notificado.');
    } catch (err) {
      console.error('Error guardando avance:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al guardar el reporte de avance'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Reporte de Avance Mensual</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Reporta el porcentaje de avance y sube evidencias de cumplimiento
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

        {/* Información de la observación */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Observación #{observacion.numero_observacion}</span>
          </div>
          <p className="text-sm font-semibold">{observacion.titulo_observacion}</p>
          {observacion.fecha_fin && (
            <p className="text-xs text-muted-foreground">
              Fecha límite: {new Date(observacion.fecha_fin).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>

        {/* Porcentaje de avance */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Porcentaje de Avance (%) *
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="0"
              max="100"
              value={porcentajeAvance}
              onChange={(e) => setPorcentajeAvance(parseInt(e.target.value) || 0)}
              className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={isSaving}
            />
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${porcentajeAvance}%` }}
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">{porcentajeAvance}%</span>
          </div>
        </div>

        {/* Descripción del avance */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Descripción del Avance *
          </label>
          <textarea
            value={descripcionAvance}
            onChange={(e) => setDescripcionAvance(e.target.value)}
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe detalladamente el avance realizado, acciones implementadas, logros alcanzados, etc..."
            required
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Incluye detalles sobre qué se ha implementado, qué falta por hacer, y cualquier observación relevante.
          </p>
        </div>

        {/* Link de evidencia */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Link de Evidencia (Google Drive) - Opcional
          </label>
          <input
            type="url"
            value={linkEvidencia}
            onChange={(e) => setLinkEvidencia(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://drive.google.com/..."
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Sube documentación, capturas, reportes u otras evidencias que demuestren el avance.
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader variant="cube" size={16} />
                Enviando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enviar Reporte de Avance
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
