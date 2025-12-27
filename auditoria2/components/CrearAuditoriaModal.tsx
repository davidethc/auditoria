'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditActivity } from './TablaActividades';

interface CrearAuditoriaModalProps {
  activity: AuditActivity | null;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export function CrearAuditoriaModal({
  activity,
  onClose,
  onSuccess,
  userId,
}: CrearAuditoriaModalProps) {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar fechas con las de la actividad si están disponibles
  useEffect(() => {
    if (activity) {
      if (activity.start_date && !fechaInicio) {
        setFechaInicio(activity.start_date.split('T')[0]);
      }
      if (activity.end_date && !fechaFin) {
        setFechaFin(activity.end_date.split('T')[0]);
      }
    }
  }, [activity]);

  if (!activity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fechaInicio || !fechaFin) {
      setError('Debes seleccionar fecha de inicio y fin');
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    setIsCreating(true);

    try {
      console.log('📝 Creando auditoría con datos:', {
        activity_id: activity.id,
        auditor_responsable_id: userId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      // Verificar que el usuario sea auditor o auditor_interno
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Error verificando rol:', userError);
        throw new Error('No se pudo verificar tu rol. Asegúrate de estar autenticado.');
      }

      if (userData && !['auditor', 'auditor_interno'].includes(userData.role)) {
        throw new Error('Solo los auditores pueden crear auditorías.');
      }

      // Crear la auditoría
      const { data: auditoria, error: createError } = await supabase
        .from('auditorias')
        .insert({
          activity_id: activity.id,
          auditor_responsable_id: userId,
          estado: 'PLANIFICADA',
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          creada_por: userId,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error detallado:', createError);
        throw createError;
      }

      console.log('✅ Auditoría creada exitosamente:', auditoria);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Error creando auditoría:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as any)?.message || 'Error al crear la auditoría. Intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg border shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Crear Nueva Auditoría</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Actividad #{activity.activity_number}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isCreating}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la actividad */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h3 className="font-semibold text-sm">Actividad a Auditar</h3>
            <p className="text-sm text-foreground">{activity.activity_description}</p>
            {activity.component && (
              <p className="text-xs text-muted-foreground">
                Componente: {activity.component}
                {activity.subcomponent && ` - ${activity.subcomponent}`}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fecha_inicio" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de Inicio
              </label>
              <input
                id="fecha_inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={isCreating}
              />
              {activity.start_date && (
                <p className="text-xs text-muted-foreground">
                  Fecha sugerida: {format(new Date(activity.start_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="fecha_fin" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de Fin
              </label>
              <input
                id="fecha_fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={isCreating}
              />
              {activity.end_date && (
                <p className="text-xs text-muted-foreground">
                  Fecha sugerida: {format(new Date(activity.end_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Error</p>
              </div>
              <p className="text-sm text-destructive/80 mt-2">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader variant="cube" size={16} />
                  Creando...
                </>
              ) : (
                'Crear Auditoría'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

