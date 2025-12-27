'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Auditoria, AuditoriaEstado } from '@/types/auditorias';

interface GestorEstadosProps {
  auditoria: Auditoria;
  onEstadoChange: () => void;
}

// Estados simplificados - solo para cuando NO está en PLANIFICADA
const estadosDisponibles: Record<string, { label: string }> = {
  EN_EJECUCION: { label: 'En Ejecución' },
  EN_REPORTE: { label: 'En Reporte' },
  CERRADA: { label: 'Cerrada' },
};

export function GestorEstados({ auditoria, onEstadoChange }: GestorEstadosProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCambiarEstado = async (nuevoEstado: AuditoriaEstado) => {
    if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado.replace('_', ' ')}"?`)) {
      return;
    }

    setIsChanging(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('auditorias')
        .update({
          estado: nuevoEstado,
        })
        .eq('id', auditoria.id);

      if (updateError) throw updateError;

      onEstadoChange();
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al cambiar el estado'
      );
    } finally {
      setIsChanging(false);
    }
  };

  // Si está cerrada, no mostrar botones
  if (auditoria.estado === 'CERRADA') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4" />
        <span>Auditoría cerrada</span>
      </div>
    );
  }

  // Si está en PLANIFICADA, no mostrar nada (el botón está en BotonNotificar)
  if (auditoria.estado === 'PLANIFICADA') {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado: {auditoria.estado.replace('_', ' ')}</span>
        {auditoria.estado === 'EN_EJECUCION' && (
          <Button
            onClick={() => handleCambiarEstado('EN_REPORTE')}
            disabled={isChanging}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isChanging ? (
              <>
                <Loader variant="cube" size={14} />
                Cambiando...
              </>
            ) : (
              'Marcar como Reporte'
            )}
          </Button>
        )}
        {auditoria.estado === 'EN_REPORTE' && (
          <Button
            onClick={() => handleCambiarEstado('CERRADA')}
            disabled={isChanging}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isChanging ? (
              <>
                <Loader variant="cube" size={14} />
                Cerrando...
              </>
            ) : (
              'Cerrar Auditoría'
            )}
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-destructive bg-destructive/10 p-4 shadow-lg z-50">
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

