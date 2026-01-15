'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Send, AlertCircle, Lock } from 'lucide-react';
import type { Auditoria } from '@/types/auditorias';

interface BotonNotificarProps {
  auditoria: Auditoria;
  onSuccess: () => void;
}

export function BotonNotificar({ auditoria, onSuccess }: BotonNotificarProps) {
  const [isNotificando, setIsNotificando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparacionCompleta, setPreparacionCompleta] = useState(false);
  const [tieneAuditados, setTieneAuditados] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [detallesFaltantes, setDetallesFaltantes] = useState<string[]>([]);

  const verificarEstado = useCallback(async () => {
    if (auditoria.estado !== 'PLANIFICADA') {
      setIsChecking(false);
      return;
    }

    try {
      const faltantes: string[] = [];

      const { data: preparacion } = await supabase
        .from('auditoria_preparacion')
        .select('objetivo, alcance, criterios')
        .eq('auditoria_id', auditoria.id)
        .eq('es_version_actual', true)
        .maybeSingle();

      const tieneObjetivo = preparacion?.objetivo?.trim() || false;
      const tieneAlcance = preparacion?.alcance?.trim() || false;
      const tieneCriterios = preparacion?.criterios?.trim() || false;

      if (!tieneObjetivo) faltantes.push('Objetivo');
      if (!tieneAlcance) faltantes.push('Alcance');
      if (!tieneCriterios) faltantes.push('Criterios');

      const prepOk = tieneObjetivo && tieneAlcance && tieneCriterios;
      setPreparacionCompleta(prepOk);

      const { data: participantes } = await supabase
        .from('auditoria_participantes')
        .select('rol_en_auditoria')
        .eq('auditoria_id', auditoria.id);

      const auditados = participantes?.filter(p => p.rol_en_auditoria === 'AUDITADO') || [];
      const tieneAuditadosOk = auditados.length > 0;
      setTieneAuditados(tieneAuditadosOk);

      if (!tieneAuditadosOk) {
        faltantes.push('Al menos un auditado');
      }

      setDetallesFaltantes(faltantes);
    } catch (err) {
      console.error('Error verificando estado:', err);
    } finally {
      setIsChecking(false);
    }
  }, [auditoria.id, auditoria.estado]);

  useEffect(() => {
    if (auditoria.estado !== 'PLANIFICADA') {
      setIsChecking(false);
      return;
    }

    verificarEstado();
  }, [auditoria.id, auditoria.estado, verificarEstado]);

  const handleNotificar = async () => {
    setIsNotificando(true);
    setError(null);

    try {
      const { data: preparacion, error: prepError } = await supabase
        .from('auditoria_preparacion')
        .select('*')
        .eq('auditoria_id', auditoria.id)
        .eq('es_version_actual', true)
        .maybeSingle();

      if (prepError) throw prepError;
      if (!preparacion) throw new Error('No se encontró la preparación');

      const { data: participantes, error: partError } = await supabase
        .from('auditoria_participantes')
        .select('user_id, rol_en_auditoria')
        .eq('auditoria_id', auditoria.id);

      if (partError) throw partError;
      
      const auditados = participantes?.filter(p => p.rol_en_auditoria === 'AUDITADO') || [];
      if (auditados.length === 0) {
        throw new Error('No hay auditados agregados');
      }

      // Obtener emails y nombres de los auditados
      const { data: usuariosAuditados, error: usuariosError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', auditados.map(a => a.user_id));

      if (usuariosError) throw usuariosError;

      const auditadosConDatos = auditados.map(a => {
        const usuario = usuariosAuditados?.find(u => u.id === a.user_id);
        return {
          user_id: a.user_id,
          email: usuario?.email || null,
          nombre: usuario?.full_name || usuario?.email || null,
        };
      });

      const { data: actividad, error: actError } = await supabase
        .from('audit_activities')
        .select('activity_number, activity_description, start_date, end_date, priority, component, subcomponent')
        .eq('id', auditoria.activity_id)
        .maybeSingle();

      if (actError) throw actError;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const mensaje = `
AUDITORÍA - ACTIVIDAD #${actividad?.activity_number || 'N/A'}

${actividad?.activity_description || 'Sin descripción'}

FECHAS:
- Inicio: ${auditoria.fecha_inicio ? new Date(auditoria.fecha_inicio).toLocaleDateString('es-ES') : 'No definida'}
- Fin: ${auditoria.fecha_fin ? new Date(auditoria.fecha_fin).toLocaleDateString('es-ES') : 'No definida'}

OBJETIVO:
${preparacion.objetivo}

ALCANCE:
${preparacion.alcance}

CRITERIOS:
${preparacion.criterios}

${preparacion.riesgos ? `RIESGOS:\n${preparacion.riesgos}\n` : ''}
${preparacion.metodologia ? `METODOLOGÍA:\n${preparacion.metodologia}\n` : ''}
${preparacion.recursos_necesarios ? `RECURSOS NECESARIOS:\n${preparacion.recursos_necesarios}\n` : ''}

Por favor, revisa esta información y confirma tu participación.
      `.trim();

      const comunicaciones = auditadosConDatos.map(participante => ({
        auditoria_id: auditoria.id,
        destinatario_id: participante.user_id,
        tipo_comunicacion: 'NOTIFICACION',
        asunto: `Auditoría - Actividad #${actividad?.activity_number || 'N/A'} - Información de Preparación`,
        mensaje: mensaje,
        metodo_envio: 'SISTEMA',
        enviado_por: session.user.id,
        confirmado: false,
      }));

      const { error: comError, data: comunicacionesInsertadas } = await supabase
        .from('comunicaciones_auditado')
        .insert(comunicaciones)
        .select('id, destinatario_id');

      if (comError) throw comError;

      // Llamar webhook de N8N para enviar correos y crear solicitudes automáticamente
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/notificar-auditados';
      
      try {
        const webhookPayload = {
          auditoria_id: auditoria.id,
          preparacion: {
            objetivo: preparacion.objetivo,
            alcance: preparacion.alcance,
            criterios: preparacion.criterios,
            riesgos: preparacion.riesgos || null,
            metodologia: preparacion.metodologia || null,
            recursos_necesarios: preparacion.recursos_necesarios || null,
          },
          actividad: {
            numero: actividad?.activity_number,
            descripcion: actividad?.activity_description,
            componente: actividad?.component,
            subcomponente: actividad?.subcomponent,
            priority: actividad?.priority,
          },
          fechas: {
            inicio: auditoria.fecha_inicio,
            fin: auditoria.fecha_fin,
          },
          auditados: auditadosConDatos.map(a => {
            const comunicacion = comunicacionesInsertadas?.find(c => c.destinatario_id === a.user_id);
            return {
              user_id: a.user_id,
              email: a.email,
              nombre: a.nombre,
              comunicacion_id: comunicacion?.id || null,
            };
          }),
          comunicaciones_ids: comunicacionesInsertadas?.map(c => c.id) || [],
        };

        // Llamar webhook de forma asíncrona (no bloquea si falla)
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        }).catch((webhookError) => {
          console.error('Error llamando webhook N8N (no crítico):', webhookError);
          // No lanzar error, solo loguear - los datos ya están en DB
        });
      } catch (webhookError) {
        console.error('Error preparando webhook N8N (no crítico):', webhookError);
        // No lanzar error, solo loguear
      }

      // Actualizar participantes: establecer fecha_notificacion y estado
      const auditadoUserIds = auditados.map(a => a.user_id).filter(Boolean);
      
      if (auditadoUserIds.length > 0) {
        const { error: partUpdateError, data: partUpdateData } = await supabase
          .from('auditoria_participantes')
          .update({
            fecha_notificacion: new Date().toISOString(),
            estado_participacion: 'NOTIFICADO',
          })
          .eq('auditoria_id', auditoria.id)
          .in('user_id', auditadoUserIds)
          .select('id, user_id');

        if (partUpdateError) {
          console.error('Error actualizando participantes:', {
            error: partUpdateError,
            message: partUpdateError.message,
            details: partUpdateError.details,
            hint: partUpdateError.hint,
            code: partUpdateError.code,
            auditoria_id: auditoria.id,
            user_ids: auditadoUserIds,
            actualizados: partUpdateData?.length || 0,
          });
          // No lanzar error, solo loguear
        } else {
          console.log(`✅ Participantes actualizados: ${partUpdateData?.length || 0} de ${auditadoUserIds.length}`);
        }
      } else {
        console.warn('⚠️ No hay user_ids válidos para actualizar participantes');
      }

      // Actualizar auditoría: marcar como notificada
      const { error: auditoriaError, data: auditoriaUpdateData } = await supabase
        .from('auditorias')
        .update({
          participantes_notificados: true,
          fecha_notificacion: new Date().toISOString(),
        })
        .eq('id', auditoria.id)
        .select('id, participantes_notificados');

      if (auditoriaError) {
        console.error('Error actualizando auditoría:', {
          error: auditoriaError,
          message: auditoriaError.message,
          details: auditoriaError.details,
          hint: auditoriaError.hint,
          code: auditoriaError.code,
          auditoria_id: auditoria.id,
        });
        // No lanzar error, solo loguear
      } else {
        console.log('✅ Auditoría actualizada:', auditoriaUpdateData?.[0]?.id);
      }

      onSuccess();
      alert(`✅ Información enviada a ${auditados.length} auditado(s)`);
    } catch (err) {
      console.error('Error notificando:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al enviar información'
      );
    } finally {
      setIsNotificando(false);
    }
  };

  if (auditoria.estado !== 'PLANIFICADA') {
    return null;
  }

  if (isChecking) {
    return (
      <Button disabled className="gap-2">
        <Loader variant="cube" size={16} />
        Verificando...
      </Button>
    );
  }

  const puedeNotificar = preparacionCompleta && tieneAuditados && !isChecking;

  const handleClick = async () => {
    // Si está bloqueado, verificar estado antes de intentar notificar
    if (!puedeNotificar && !isChecking) {
      setIsChecking(true);
      await verificarEstado();
      return;
    }
    
    // Si está desbloqueado, proceder con la notificación
    if (puedeNotificar) {
      handleNotificar();
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleClick}
        disabled={isNotificando || isChecking}
        className="gap-2"
        size="lg"
        variant={puedeNotificar ? "default" : "secondary"}
        title={!puedeNotificar ? "Completa la preparación y agrega auditados para habilitar" : ""}
      >
        {isNotificando ? (
          <>
            <Loader variant="cube" size={16} />
            Enviando...
          </>
        ) : !puedeNotificar ? (
          <>
            <Lock className="h-4 w-4" />
            Notificar Auditados
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Notificar Auditados
          </>
        )}
      </Button>

      {!puedeNotificar && !isChecking && (
        <div className="absolute top-full right-0 mt-2 w-96 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-xs shadow-lg z-50">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                Botón bloqueado - Requisitos pendientes:
              </p>
              <ul className="list-disc list-inside text-amber-800 dark:text-amber-200 space-y-1">
                {detallesFaltantes.length > 0 ? (
                  detallesFaltantes.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>Completa la preparación y agrega auditados</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-lg border border-destructive bg-destructive/10 p-4 shadow-lg z-50">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
