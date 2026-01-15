'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, CheckCircle2, X, FileText, Calendar, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatearFecha } from '@/utils/auditoriaHelpers';
import type { AuditoriaObservacion, ObservacionEvidencia } from '@/types/auditorias';

export default function RevisionDescargosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [observaciones, setObservaciones] = useState<AuditoriaObservacion[]>([]);
  const [evidencias, setEvidencias] = useState<Record<string, ObservacionEvidencia[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (userRole === 'auditor_interno' || userRole === 'auditor') {
      loadObservaciones();
    }
  }, [userRole]);

  const loadUserRole = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserRole(data.role);
        if (data.role !== 'auditor_interno' && data.role !== 'auditor') {
          setError('Solo los auditores pueden acceder a esta sección');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Error cargando rol:', err);
    }
  };

  const loadObservaciones = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar observaciones con descargos o evidencias
      const { data: observacionesData, error: obsError } = await supabase
        .from('auditoria_observaciones')
        .select(`
          *,
          auditor:users!auditoria_observaciones_auditor_id_fkey(id, full_name, email),
          responsable_implementacion_user:users!auditoria_observaciones_responsable_implementacion_fkey(id, full_name, email),
          auditoria:auditorias!auditoria_observaciones_auditoria_id_fkey(id, estado)
        `)
        .or('descripcion_descargos.not.is.null,descripcion_avance.not.is.null')
        .order('created_at', { ascending: false });

      if (obsError) throw obsError;

      setObservaciones(observacionesData || []);

      // Cargar evidencias para cada observación
      if (observacionesData && observacionesData.length > 0) {
        const observacionIds = observacionesData.map(o => o.id);
        const { data: evidenciasData, error: evError } = await supabase
          .from('observacion_evidencias')
          .select('*')
          .in('observacion_id', observacionIds)
          .order('subida_at', { ascending: false });

        if (evError) throw evError;

        const evidenciasPorObservacion: Record<string, ObservacionEvidencia[]> = {};
        observacionesData.forEach(obs => {
          evidenciasPorObservacion[obs.id] = evidenciasData?.filter(e => e.observacion_id === obs.id) || [];
        });

        setEvidencias(evidenciasPorObservacion);
      }
    } catch (err) {
      console.error('Error cargando observaciones:', err);
      setError('Error al cargar las observaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAprobarDescargo = async (evidenciaId: string, observacionId: string) => {
    if (!confirm('¿Aprobar este descargo/evidencia?')) return;

    try {
      const { error } = await supabase
        .from('observacion_evidencias')
        .update({
          aprobada: true,
          revisada: true,
          revisada_por: user?.id || null,
          revisada_at: new Date().toISOString(),
        })
        .eq('id', evidenciaId);

      if (error) throw error;

      // Si es descargo y está aprobado, actualizar estado de observación
      const evidencia = evidencias[observacionId]?.find(e => e.id === evidenciaId);
      if (evidencia?.tipo_evidencia === 'DESCARGO' && evidencia.aprobada) {
        // Opcional: actualizar estado de observación
      }

      loadObservaciones();
      alert('✅ Descargo/evidencia aprobado exitosamente');
    } catch (err) {
      console.error('Error aprobando:', err);
      alert('Error al aprobar el descargo/evidencia');
    }
  };

  const handleRechazarDescargo = async (evidenciaId: string, comentarios: string) => {
    if (!comentarios.trim()) {
      alert('Debes proporcionar comentarios sobre por qué se rechaza');
      return;
    }

    try {
      const { error } = await supabase
        .from('observacion_evidencias')
        .update({
          aprobada: false,
          revisada: true,
          revisada_por: user?.id || null,
          revisada_at: new Date().toISOString(),
          comentarios_revision: comentarios.trim(),
        })
        .eq('id', evidenciaId);

      if (error) throw error;

      loadObservaciones();
      alert('✅ Descargo/evidencia rechazado. El auditado ha sido notificado.');
    } catch (err) {
      console.error('Error rechazando:', err);
      alert('Error al rechazar el descargo/evidencia');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader variant="cube" size={48}>
          <span className="text-sm text-muted-foreground mt-4">Cargando...</span>
        </Loader>
      </div>
    );
  }

  if (error || userRole !== 'auditor_interno' && userRole !== 'auditor') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error || 'No tienes permisos para acceder a esta sección'}</p>
          </div>
        </div>
      </div>
    );
  }

  const observacionesConDescargos = observaciones.filter(obs => {
    const evidenciasObs = evidencias[obs.id] || [];
    return evidenciasObs.length > 0 || obs.descripcion_descargos || obs.descripcion_avance;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revisión de Descargos y Estrategias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y valida los descargos, evidencias y estrategias presentadas por los auditados
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          Volver
        </Button>
      </div>

      {observacionesConDescargos.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No hay descargos, evidencias o estrategias pendientes de revisión
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {observacionesConDescargos.map((observacion) => {
            const evidenciasObs = evidencias[observacion.id] || [];
            const descargos = evidenciasObs.filter(e => e.tipo_evidencia === 'DESCARGO');
            const evidenciasNormales = evidenciasObs.filter(e => e.tipo_evidencia === 'EVIDENCIA');

            return (
              <div key={observacion.id} className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        #{observacion.numero_observacion}
                      </Badge>
                      <Badge variant="secondary">
                        {observacion.estado_observacion}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {observacion.titulo_observacion}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {observacion.descripcion_observacion}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Responsable:</span>
                        <span className="font-medium">
                          {observacion.responsable_implementacion_user?.full_name || 
                           observacion.responsable_implementacion_user?.email || 
                           'No asignado'}
                        </span>
                      </div>
                      {observacion.fecha_fin && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Fecha límite:</span>
                          <span className="font-medium">
                            {formatearFecha(observacion.fecha_fin)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/auditorias/${observacion.auditoria_id}`)}
                  >
                    Ver Auditoría
                  </Button>
                </div>

                {/* Estrategia */}
                {observacion.estrategia && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold mb-2">Estrategia de Implementación</h4>
                    <p className="text-sm">{observacion.estrategia}</p>
                    {observacion.fecha_inicio && observacion.fecha_fin && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Fechas: {formatearFecha(observacion.fecha_inicio)} - {formatearFecha(observacion.fecha_fin)}
                      </div>
                    )}
                  </div>
                )}

                {/* Avance */}
                {observacion.descripcion_avance && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Reporte de Avance</h4>
                      <Badge variant="outline">{observacion.porcentaje_avance}%</Badge>
                    </div>
                    <p className="text-sm">{observacion.descripcion_avance}</p>
                  </div>
                )}

                {/* Descargos */}
                {descargos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Descargos Presentados</h4>
                    {descargos.map((descargo) => (
                      <div key={descargo.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">{descargo.descripcion}</p>
                            {descargo.archivo_url && (
                              <a
                                href={descargo.archivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" />
                                Ver evidencia
                              </a>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Subido: {formatearFecha(descargo.subida_at)}
                            </p>
                          </div>
                          {descargo.revisada ? (
                            <Badge variant={descargo.aprobada ? 'default' : 'destructive'}>
                              {descargo.aprobada ? 'Aprobado' : 'Rechazado'}
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const comentarios = prompt('Comentarios de rechazo (obligatorio):');
                                  if (comentarios) {
                                    handleRechazarDescargo(descargo.id, comentarios);
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAprobarDescargo(descargo.id, observacion.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {descargo.comentarios_revision && (
                          <div className="rounded bg-muted p-2 text-xs">
                            <strong>Comentarios de revisión:</strong> {descargo.comentarios_revision}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Evidencias de avance */}
                {evidenciasNormales.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Evidencias de Avance</h4>
                    {evidenciasNormales.map((evidencia) => (
                      <div key={evidencia.id} className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{evidencia.descripcion}</p>
                            {evidencia.archivo_url && (
                              <a
                                href={evidencia.archivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                <FileText className="h-3 w-3" />
                                Ver evidencia
                              </a>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Subido: {formatearFecha(evidencia.subida_at)}
                            </p>
                          </div>
                          {evidencia.revisada ? (
                            <Badge variant={evidencia.aprobada ? 'default' : 'destructive'}>
                              {evidencia.aprobada ? 'Aprobado' : 'Rechazado'}
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const comentarios = prompt('Comentarios de rechazo (obligatorio):');
                                  if (comentarios) {
                                    handleRechazarDescargo(evidencia.id, comentarios);
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAprobarDescargo(evidencia.id, observacion.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {evidencia.comentarios_revision && (
                          <div className="rounded bg-muted p-2 text-xs">
                            <strong>Comentarios:</strong> {evidencia.comentarios_revision}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
