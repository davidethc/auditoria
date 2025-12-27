'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { CheckCircle2, Circle } from 'lucide-react';
import type { AuditoriaObservacion } from '@/types/auditorias';

interface SelectorObservacionesProps {
  auditoriaId: string;
  observacionesSeleccionadas: string[]; // IDs de observaciones seleccionadas
  onObservacionesChange: (ids: string[]) => void;
}

export function SelectorObservaciones({
  auditoriaId,
  observacionesSeleccionadas,
  onObservacionesChange,
}: SelectorObservacionesProps) {
  const [observaciones, setObservaciones] = useState<AuditoriaObservacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadObservaciones();
  }, [auditoriaId]);

  const loadObservaciones = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('auditoria_observaciones')
        .select('*')
        .eq('auditoria_id', auditoriaId)
        .order('numero_observacion', { ascending: true });

      if (error) throw error;
      setObservaciones(data || []);
    } catch (err) {
      console.error('Error cargando observaciones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleObservacion = (observacionId: string) => {
    const nuevasSeleccionadas = observacionesSeleccionadas.includes(observacionId)
      ? observacionesSeleccionadas.filter(id => id !== observacionId)
      : [...observacionesSeleccionadas, observacionId];
    
    onObservacionesChange(nuevasSeleccionadas);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader variant="cube" size={24} />
      </div>
    );
  }

  if (observaciones.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No hay observaciones registradas. Primero debes registrar observaciones en la sección de Ejecución.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">
          Selecciona las observaciones para incluir en el informe:
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          {observacionesSeleccionadas.length} de {observaciones.length} seleccionadas
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {observaciones.map((observacion) => {
          const estaSeleccionada = observacionesSeleccionadas.includes(observacion.id);

          return (
            <div
              key={observacion.id}
              onClick={() => toggleObservacion(observacion.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                estaSeleccionada
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {estaSeleccionada ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      #{observacion.numero_observacion}
                    </Badge>
                    <span className="text-sm font-medium">
                      {observacion.titulo_observacion}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {observacion.descripcion_observacion}
                  </p>
                  {observacion.recomendacion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Recomendación:</span>{' '}
                      {observacion.recomendacion.substring(0, 100)}
                      {observacion.recomendacion.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

