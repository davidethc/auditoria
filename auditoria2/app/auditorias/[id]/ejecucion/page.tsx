'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { MatrizObservaciones } from '@/components/MatrizObservaciones';
import { FormularioObservacion } from '@/components/FormularioObservacion';
import type { AuditoriaObservacion, AuditoriaCompleta } from '@/types/auditorias';

export default function EjecucionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [auditoria, setAuditoria] = useState<AuditoriaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormulario, setShowFormulario] = useState(false);
  const [observacionSeleccionada, setObservacionSeleccionada] = useState<AuditoriaObservacion | null>(null);
  const [isFinalizando, setIsFinalizando] = useState(false);

  useEffect(() => {
    if (params.id && user) {
      loadAuditoria();
    }
  }, [params.id, user]);

  const loadAuditoria = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: auditoriaData, error: auditoriaError } = await supabase
        .from('auditorias')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (auditoriaError) throw auditoriaError;
      if (!auditoriaData) {
        setError('Auditoría no encontrada');
        setIsLoading(false);
        return;
      }

      // Verificar permisos
      if (auditoriaData.auditor_responsable_id !== user?.id) {
        setError('No tienes permisos para ver esta auditoría');
        setIsLoading(false);
        return;
      }

      // Verificar estado
      if (auditoriaData.estado !== 'EN_EJECUCION') {
        const estadoActual = auditoriaData.estado;
        let mensaje = `Esta auditoría está en estado "${estadoActual}". `;
        
        if (estadoActual === 'EN_REPORTE' || estadoActual === 'CERRADA') {
          mensaje += 'La ejecución ya fue finalizada. Debes ir a la sección de "Informe" para crear el informe borrador.';
          // Redirigir automáticamente después de 3 segundos
          setTimeout(() => {
            router.push(`/auditorias/${params.id}/informe`);
          }, 3000);
        } else if (estadoActual === 'PLANIFICADA') {
          mensaje += 'Primero debes completar la preparación y notificar a los auditados, luego usar el botón "Iniciar Ejecución".';
        } else {
          mensaje += 'Solo se puede ejecutar cuando está en EN_EJECUCION.';
        }
        
        setError(mensaje);
        setIsLoading(false);
        return;
      }

      setAuditoria(auditoriaData as AuditoriaCompleta);
    } catch (err) {
      console.error('Error cargando auditoría:', err);
      setError('Error al cargar la auditoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizarEjecucion = async () => {
    if (!confirm('¿Estás seguro de finalizar la ejecución? Esto cambiará el estado a EN_REPORTE.')) {
      return;
    }

    setIsFinalizando(true);
    try {
      const { error: updateError } = await supabase
        .from('auditorias')
        .update({
          estado: 'EN_REPORTE',
          ejecucion_iniciada: true,
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      alert('✅ Ejecución finalizada. Ahora puedes crear el informe borrador.');
      router.push(`/auditorias/${params.id}/informe`);
    } catch (err) {
      console.error('Error finalizando ejecución:', err);
      alert('Error al finalizar la ejecución');
    } finally {
      setIsFinalizando(false);
    }
  };

  const handleObservacionEdit = (observacion: AuditoriaObservacion | null) => {
    setObservacionSeleccionada(observacion);
    setShowFormulario(true);
  };

  const handleFormularioSuccess = () => {
    setShowFormulario(false);
    setObservacionSeleccionada(null);
    loadAuditoria();
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

  if (error || !auditoria) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error || 'Auditoría no encontrada'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ejecución de Auditoría</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registra las observaciones encontradas durante la ejecución
            </p>
          </div>
        </div>
        <Button
          onClick={handleFinalizarEjecucion}
          disabled={isFinalizando}
          className="gap-2"
          variant="default"
        >
          {isFinalizando ? (
            <>
              <Loader variant="cube" size={16} />
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Finalizar Ejecución
            </>
          )}
        </Button>
      </div>

      {showFormulario ? (
        <FormularioObservacion
          auditoriaId={auditoria.id}
          observacion={observacionSeleccionada}
          onSuccess={handleFormularioSuccess}
          onCancel={() => {
            setShowFormulario(false);
            setObservacionSeleccionada(null);
          }}
          currentUserId={user?.id || ''}
        />
      ) : (
        <MatrizObservaciones
          auditoriaId={auditoria.id}
          onObservacionEdit={handleObservacionEdit}
          readOnly={false}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}

