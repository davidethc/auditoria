'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import type { AuditoriaPreparacion } from '@/types/auditorias';

interface PreparacionFormProps {
  auditoriaId: string;
  preparacion?: AuditoriaPreparacion | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function PreparacionForm({
  auditoriaId,
  preparacion,
  onSuccess,
  readOnly = false,
}: PreparacionFormProps) {
  const [objetivo, setObjetivo] = useState('');
  const [alcance, setAlcance] = useState('');
  const [criterios, setCriterios] = useState('');
  const [riesgos, setRiesgos] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [recursos, setRecursos] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preparacion) {
      setObjetivo(preparacion.objetivo || '');
      setAlcance(preparacion.alcance || '');
      setCriterios(preparacion.criterios || '');
      setRiesgos(preparacion.riesgos || '');
      setMetodologia(preparacion.metodologia || '');
      setRecursos(preparacion.recursos_necesarios || '');
    }
  }, [preparacion]);

  const handleGuardar = async () => {
    if (!objetivo.trim() || !alcance.trim() || !criterios.trim()) {
      setError('Los campos Objetivo, Alcance y Criterios son obligatorios');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      if (preparacion) {
        const { error: updateError } = await supabase
          .from('auditoria_preparacion')
          .update({
            objetivo,
            alcance,
            criterios,
            riesgos,
            metodologia,
            recursos_necesarios: recursos,
          })
          .eq('id', preparacion.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('auditoria_preparacion')
          .insert({
            auditoria_id: auditoriaId,
            objetivo,
            alcance,
            criterios,
            riesgos,
            metodologia,
            recursos_necesarios: recursos,
            preparada_por: session.user.id,
            version: 1,
            es_version_actual: true,
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSuccess();
    } catch (err) {
      console.error('Error guardando preparación:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al guardar la preparación'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preparación del Plan de Auditoría</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="objetivo" className="text-sm font-medium">
            Objetivo <span className="text-destructive">*</span>
          </label>
          <textarea
            id="objetivo"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe el objetivo de esta auditoría..."
            required
            disabled={readOnly || isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="alcance" className="text-sm font-medium">
            Alcance <span className="text-destructive">*</span>
          </label>
          <textarea
            id="alcance"
            value={alcance}
            onChange={(e) => setAlcance(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Define el alcance de la auditoría..."
            required
            disabled={readOnly || isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="criterios" className="text-sm font-medium">
            Criterios de Evaluación <span className="text-destructive">*</span>
          </label>
          <textarea
            id="criterios"
            value={criterios}
            onChange={(e) => setCriterios(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Establece los criterios de evaluación..."
            required
            disabled={readOnly || isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="riesgos" className="text-sm font-medium">
            Riesgos Identificados
          </label>
          <textarea
            id="riesgos"
            value={riesgos}
            onChange={(e) => setRiesgos(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Identifica los riesgos..."
            disabled={readOnly || isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="metodologia" className="text-sm font-medium">
            Metodología
          </label>
          <textarea
            id="metodologia"
            value={metodologia}
            onChange={(e) => setMetodologia(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe la metodología a utilizar..."
            disabled={readOnly || isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="recursos" className="text-sm font-medium">
            Recursos Necesarios
          </label>
          <textarea
            id="recursos"
            value={recursos}
            onChange={(e) => setRecursos(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Lista los recursos necesarios..."
            disabled={readOnly || isSaving}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">Preparación guardada exitosamente</p>
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="flex justify-end">
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
                  Guardar Preparación
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
