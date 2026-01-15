'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Send, MessageSquare } from 'lucide-react';
import type { AuditoriaObservacion } from '@/types/auditorias';

interface SolicitarCorreccionObservacionProps {
  observacion: AuditoriaObservacion;
  auditoriaId: string;
  currentUserId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SolicitarCorreccionObservacion({
  observacion,
  auditoriaId,
  currentUserId,
  onSuccess,
  onCancel,
}: SolicitarCorreccionObservacionProps) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitud, setSolicitud] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitud.trim()) {
      setError('Debes describir qué corrección solicitas');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Obtener datos del auditor responsable
      const { data: auditoriaData } = await supabase
        .from('auditorias')
        .select('auditor_responsable_id')
        .eq('id', auditoriaId)
        .maybeSingle();

      if (!auditoriaData?.auditor_responsable_id) {
        throw new Error('No se encontró el auditor responsable');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: currentUserData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', currentUserId)
        .maybeSingle();

      // Crear comunicación al auditor solicitando corrección
      const { error: comError } = await supabase
        .from('comunicaciones_auditado')
        .insert({
          auditoria_id: auditoriaId,
          destinatario_id: auditoriaData.auditor_responsable_id,
          tipo_comunicacion: 'NOTIFICACION',
          asunto: `Solicitud de corrección o modificación - Observación #${observacion.numero_observacion}`,
          mensaje: `El auditado ${currentUserData?.full_name || currentUserData?.email || 'Usuario'} te solicita que revises y, si lo consideras pertinente, realices una corrección o modificación en la siguiente observación:\n\nOBSERVACIÓN #${observacion.numero_observacion}\nTítulo: ${observacion.titulo_observacion}\nDescripción: ${observacion.descripcion_observacion}\n\nSOLICITUD DEL AUDITADO:\n${solicitud.trim()}\n\nPor favor, revisa la solicitud del auditado y decide si realizar las correcciones o modificaciones sugeridas según corresponda.`,
          metodo_envio: 'SISTEMA',
          enviado_por: session?.user.id || null,
          confirmado: false,
        });

      if (comError) throw comError;

      onSuccess();
      alert('✅ Solicitud de corrección enviada al auditor exitosamente');
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al enviar la solicitud de corrección'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Solicitar Corrección o Modificación al Auditor</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Si consideras que esta observación necesita corrección o ajuste, puedes solicitar al <strong>auditor</strong> que la revise y la modifique según tus comentarios. El auditor recibirá tu solicitud y decidirá si realizar las correcciones solicitadas.
            </p>
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

        {/* Información de la observación */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Observación #{observacion.numero_observacion}</span>
          </div>
          <p className="text-sm font-semibold">{observacion.titulo_observacion}</p>
          <p className="text-sm text-muted-foreground">{observacion.descripcion_observacion}</p>
        </div>

        {/* Campo de solicitud */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Describe qué corrección, modificación o ajuste solicitas al auditor *
          </label>
          <textarea
            value={solicitud}
            onChange={(e) => setSolicitud(e.target.value)}
            className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ej: Solicito al auditor que revise la descripción porque no es precisa - debería mencionar que el problema afecta específicamente al módulo de facturación. También solicito que se ajuste la recomendación para incluir un plazo de implementación. Considero que el título no refleja adecuadamente el alcance del hallazgo..."
            required
            disabled={isSending}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Sé específico sobre qué parte de la observación necesita corrección o modificación y por qué. <strong>El auditor</strong> revisará tu solicitud y decidirá si realizar los ajustes solicitados.
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSending} className="gap-2">
            {isSending ? (
              <>
                <Loader variant="cube" size={16} />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Solicitud
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
