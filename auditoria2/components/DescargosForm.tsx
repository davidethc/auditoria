'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Plus, FileText, Link as LinkIcon } from 'lucide-react';
import type { AuditoriaObservacion, ObservacionEvidencia } from '@/types/auditorias';

interface DescargosFormProps {
  auditoriaId: string;
  observaciones: AuditoriaObservacion[];
  currentUserId: string;
  readOnly?: boolean;
}

export function DescargosForm({
  auditoriaId,
  observaciones,
  currentUserId,
  readOnly = false,
}: DescargosFormProps) {
  const [evidencias, setEvidencias] = useState<Record<string, ObservacionEvidencia[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showFormulario, setShowFormulario] = useState(false);
  const [observacionSeleccionada, setObservacionSeleccionada] = useState<AuditoriaObservacion | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [linkDrive, setLinkDrive] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvidencias();
  }, [observaciones]);

  const loadEvidencias = async () => {
    setIsLoading(true);
    try {
      const observacionIds = observaciones.map(o => o.id);
      if (observacionIds.length === 0) {
        setEvidencias({});
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('observacion_evidencias')
        .select('*')
        .in('observacion_id', observacionIds)
        .eq('tipo_evidencia', 'DESCARGO')
        .order('subida_at', { ascending: false });

      if (fetchError) throw fetchError;

      const evidenciasPorObservacion: Record<string, ObservacionEvidencia[]> = {};
      observaciones.forEach(obs => {
        evidenciasPorObservacion[obs.id] = data?.filter(e => e.observacion_id === obs.id) || [];
      });

      setEvidencias(evidenciasPorObservacion);
    } catch (err) {
      console.error('Error cargando evidencias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresentarDescargo = (observacion: AuditoriaObservacion) => {
    setObservacionSeleccionada(observacion);
    setDescripcion('');
    setLinkDrive('');
    setShowFormulario(true);
  };

  const validarLinkDrive = (url: string): boolean => {
    // Validar que sea un link válido de Google Drive
    const drivePatterns = [
      /^https?:\/\/(drive\.google\.com|docs\.google\.com)/,
      /^https?:\/\/.*google.*drive/,
    ];
    return drivePatterns.some(pattern => pattern.test(url));
  };

  const handleGuardarDescargo = async () => {
    if (!observacionSeleccionada) return;

    if (!descripcion.trim()) {
      setError('La descripción del descargo es obligatoria');
      return;
    }

    if (!linkDrive.trim()) {
      setError('El link de Drive es obligatorio');
      return;
    }

    // Validar formato del link
    if (!validarLinkDrive(linkDrive.trim())) {
      setError('El link debe ser un enlace válido de Google Drive');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Crear evidencia de tipo DESCARGO
      const { error: insertError } = await supabase
        .from('observacion_evidencias')
        .insert({
          observacion_id: observacionSeleccionada.id,
          tipo_evidencia: 'DESCARGO',
          descripcion: descripcion.trim(),
          archivo_url: linkDrive.trim(),
          subida_por: currentUserId,
        });

      if (insertError) throw insertError;

      // Actualizar descripción de descargos en la observación
      await supabase
        .from('auditoria_observaciones')
        .update({
          descripcion_descargos: descripcion.trim(),
        })
        .eq('id', observacionSeleccionada.id);

      setShowFormulario(false);
      setObservacionSeleccionada(null);
      setDescripcion('');
      setLinkDrive('');
      loadEvidencias();
      alert('✅ Descargo presentado exitosamente');
    } catch (err) {
      console.error('Error guardando descargo:', err);
      setError('Error al guardar el descargo');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader variant="cube" size={32} />
      </div>
    );
  }

  const observacionesConDescargo = observaciones.filter(obs => {
    const evidenciasObs = evidencias[obs.id] || [];
    return evidenciasObs.length > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Presentar Descargos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Si consideras que alguna observación no aplica o requiere aclaración, presenta un descargo
          </p>
        </div>
      </div>

      {showFormulario && observacionSeleccionada ? (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Observación:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <Badge variant="outline" className="mb-2">
                #{observacionSeleccionada.numero_observacion}
              </Badge>
              <p className="font-medium">{observacionSeleccionada.titulo_observacion}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {observacionSeleccionada.descripcion_observacion}
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

          <div>
            <label className="text-sm font-medium mb-2 block">
              Descripción del Descargo *
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Explica por qué consideras que la observación no aplica o requiere aclaración..."
              required
              disabled={isSaving || readOnly}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link de Google Drive con Evidencias *
            </label>
            <input
              type="url"
              value={linkDrive}
              onChange={(e) => setLinkDrive(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="https://drive.google.com/..."
              required
              disabled={isSaving || readOnly}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFormulario(false);
                setObservacionSeleccionada(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGuardarDescargo}
              disabled={isSaving || readOnly}
            >
              {isSaving ? 'Guardando...' : 'Presentar Descargo'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {observaciones.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay observaciones asignadas a esta auditoría
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {observaciones.map((observacion) => {
                const evidenciasObs = evidencias[observacion.id] || [];
                const tieneDescargo = evidenciasObs.length > 0;

                return (
                  <div key={observacion.id} className="rounded-lg border bg-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            #{observacion.numero_observacion}
                          </Badge>
                          <h4 className="font-medium">{observacion.titulo_observacion}</h4>
                          {tieneDescargo && (
                            <Badge variant="secondary">Descargo Presentado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {observacion.descripcion_observacion}
                        </p>
                      </div>
                      {!readOnly && !tieneDescargo && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePresentarDescargo(observacion)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Presentar Descargo
                        </Button>
                      )}
                    </div>

                    {tieneDescargo && (
                      <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                        {evidenciasObs.map((evidencia) => (
                          <div key={evidencia.id} className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm">{evidencia.descripcion}</p>
                              {evidencia.archivo_url && (
                                <a
                                  href={evidencia.archivo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Ver evidencias en Drive
                                </a>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Presentado: {new Date(evidencia.subida_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

