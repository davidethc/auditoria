'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { AuditoriaInforme } from '@/types/auditorias';
import { formatearFecha } from '@/utils/auditoriaHelpers';

interface RevisorInformeProps {
  informe: AuditoriaInforme;
  onSuccess: () => void;
  currentUserId: string;
}

export function RevisorInforme({
  informe,
  onSuccess,
  currentUserId,
}: RevisorInformeProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState(informe.comentarios_revision || '');
  const [accion, setAccion] = useState<'aprobar' | 'corregir' | null>(null);

  const handleAprobar = async () => {
    if (!confirm('¿Estás seguro de aprobar este informe borrador?')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('auditoria_informe')
        .update({
          estado: 'APROBADO',
          aprobado_por: currentUserId,
          fecha_aprobacion: new Date().toISOString(),
          revisado_por: currentUserId,
          fecha_revision: new Date().toISOString(),
          comentarios_revision: comentarios.trim() || null,
        })
        .eq('id', informe.id);

      if (updateError) throw updateError;

      // Actualizar auditoría
      await supabase
        .from('auditorias')
        .update({ informe_aprobado: true, fecha_aprobacion_informe: new Date().toISOString() })
        .eq('id', informe.auditoria_id);

      onSuccess();
      alert('✅ Informe aprobado exitosamente');
    } catch (err) {
      console.error('Error aprobando informe:', err);
      setError('Error al aprobar el informe');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSolicitarCorrecciones = async () => {
    if (!comentarios.trim()) {
      setError('Debes agregar comentarios explicando las correcciones necesarias');
      return;
    }

    if (!confirm('¿Estás seguro de solicitar correcciones? El auditor deberá corregir el informe.')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('auditoria_informe')
        .update({
          estado: 'CON_CORRECCIONES',
          revisado_por: currentUserId,
          fecha_revision: new Date().toISOString(),
          comentarios_revision: comentarios.trim(),
        })
        .eq('id', informe.id);

      if (updateError) throw updateError;

      onSuccess();
      alert('✅ Correcciones solicitadas. El auditor será notificado.');
    } catch (err) {
      console.error('Error solicitando correcciones:', err);
      setError('Error al solicitar correcciones');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Revisar Informe Borrador</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Versión {informe.version} - {formatearFecha(informe.fecha_elaboracion)}
            </p>
          </div>
          <Badge variant="outline">EN_REVISION</Badge>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Vista del informe */}
        <div className="space-y-6 border-b pb-6">
          <div>
            <h4 className="font-medium mb-2">Encabezado</h4>
            <p className="text-sm">{informe.encabezado || '-'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">De</h4>
              <p className="text-sm">{informe.de || '-'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Para</h4>
              <p className="text-sm">{informe.para || '-'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Asunto</h4>
            <p className="text-sm">{informe.asunto || '-'}</p>
          </div>

          {informe.antecedentes && (
            <div>
              <h4 className="font-medium mb-2">Antecedentes</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.antecedentes}</p>
            </div>
          )}

          {informe.objetivos && (
            <div>
              <h4 className="font-medium mb-2">Objetivos</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.objetivos}</p>
            </div>
          )}

          {informe.alcance && (
            <div>
              <h4 className="font-medium mb-2">Alcance</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.alcance}</p>
            </div>
          )}

          {informe.resultados_revision && (
            <div>
              <h4 className="font-medium mb-2">Resultados de la Revisión</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.resultados_revision}</p>
            </div>
          )}

          {informe.metodologia_aplicada && (
            <div>
              <h4 className="font-medium mb-2">Metodología Aplicada</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.metodologia_aplicada}</p>
            </div>
          )}

          {informe.observaciones_enumeradas && Array.isArray(informe.observaciones_enumeradas) && informe.observaciones_enumeradas.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">
                {informe.titulo_observaciones || 'Observaciones'}
              </h4>
              <div className="space-y-3">
                {informe.observaciones_enumeradas.map((obs: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{obs.numero || idx + 1}</Badge>
                      <span className="font-medium">{obs.titulo}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{obs.descripcion}</p>
                    <p className="text-sm">
                      <span className="font-medium">Recomendación:</span> {obs.recomendacion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {informe.conclusiones && (
            <div>
              <h4 className="font-medium mb-2">Conclusiones</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.conclusiones}</p>
            </div>
          )}

          {informe.recomendaciones_generales && (
            <div>
              <h4 className="font-medium mb-2">Recomendaciones Generales</h4>
              <p className="text-sm whitespace-pre-wrap">{informe.recomendaciones_generales}</p>
            </div>
          )}
        </div>

        {/* Comentarios de revisión */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentarios de Revisión
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Agrega comentarios sobre el informe. Si solicitas correcciones, explica qué debe corregirse..."
              disabled={isProcessing}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSolicitarCorrecciones}
              disabled={isProcessing || !comentarios.trim()}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Solicitar Correcciones
            </Button>
            <Button
              type="button"
              onClick={handleAprobar}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader variant="cube" size={16} />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobar Informe
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

