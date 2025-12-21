'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import type { Auditoria, AuditoriaEstado } from '@/types/auditorias';

interface GestorEstadosProps {
  auditoria: Auditoria;
  onEstadoChange: () => void;
}

const flujoEstados: Record<AuditoriaEstado, { siguiente: AuditoriaEstado | null; label: string; descripcion: string }> = {
  PLANIFICADA: {
    siguiente: 'EN_PREPARACION',
    label: 'Iniciar Preparación',
    descripcion: 'Completar preparación y seleccionar participantes',
  },
  EN_PREPARACION: {
    siguiente: 'EN_EJECUCION',
    label: 'Iniciar Ejecución',
    descripcion: 'Comenzar a ejecutar la auditoría',
  },
  EN_EJECUCION: {
    siguiente: 'EN_REPORTE',
    label: 'Generar Reporte',
    descripcion: 'La ejecución está completa, generar reporte',
  },
  EN_REPORTE: {
    siguiente: 'CERRADA',
    label: 'Cerrar Auditoría',
    descripcion: 'Finalizar y cerrar la auditoría',
  },
  CERRADA: {
    siguiente: null,
    label: 'Auditoría Cerrada',
    descripcion: 'La auditoría ha sido cerrada',
  },
};

export function GestorEstados({ auditoria, onEstadoChange }: GestorEstadosProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const flujo = flujoEstados[auditoria.estado];

  const handleCambiarEstado = async (nuevoEstado: AuditoriaEstado) => {
    // Validaciones específicas por estado
    if (nuevoEstado === 'EN_PREPARACION') {
      // Verificar que tenga preparación completada
      const { data: preparacion } = await supabase
        .from('auditoria_preparacion')
        .select('id')
        .eq('auditoria_id', auditoria.id)
        .maybeSingle();

      if (!preparacion) {
        setError('Debes completar la preparación antes de continuar');
        return;
      }
    }

    if (nuevoEstado === 'EN_EJECUCION') {
      // Verificar que tenga participantes
      const { data: participantes } = await supabase
        .from('auditoria_participantes')
        .select('id')
        .eq('auditoria_id', auditoria.id);

      if (!participantes || participantes.length === 0) {
        setError('Debes agregar al menos un participante antes de ejecutar');
        return;
      }
    }

    if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado.replace('_', ' ')}"?`)) {
      setShowMenu(false);
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

      setShowMenu(false);
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

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Botón principal - siguiente estado */}
        {flujo.siguiente && (
          <Button
            onClick={() => handleCambiarEstado(flujo.siguiente!)}
            disabled={isChanging}
            className="gap-2"
          >
            {isChanging ? (
              <>
                <Loader variant="cube" size={16} />
                Cambiando...
              </>
            ) : (
              flujo.label
            )}
          </Button>
        )}

        {/* Botón de menú para otros estados */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          disabled={isChanging}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Menú desplegable */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border bg-card shadow-lg z-50">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
              Cambiar estado a:
            </div>
            {Object.entries(flujoEstados).map(([estado, info]) => {
              const estadoKey = estado as AuditoriaEstado;
              const esCerrada = estadoKey === 'CERRADA';
              const esActual = estadoKey === auditoria.estado;

              if (esActual) return null;

              return (
                <button
                  key={estado}
                  onClick={() => handleCambiarEstado(estadoKey)}
                  disabled={isChanging}
                  className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <div className="font-medium">{estadoKey.replace('_', ' ')}</div>
                  <div className="text-xs text-muted-foreground">{info.descripcion}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-destructive bg-destructive/10 p-4 shadow-lg z-50">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error al cambiar estado</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

