'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SelectValidacionProps {
  activityId: string;
  currentStatus: string | null;
  onStatusChange?: (newStatus: string) => void;
  canEdit: boolean; // Solo auditor puede editar su validación
  className?: string;
}

type ValidationStatus = 'cumplido' | 'pendiente' | null;

export function SelectValidacion({
  activityId,
  currentStatus,
  onStatusChange,
  canEdit,
  className,
}: SelectValidacionProps) {
  const [status, setStatus] = useState<ValidationStatus>(
    (currentStatus?.toLowerCase() as ValidationStatus) || null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: ValidationStatus) => {
    if (!canEdit || newStatus === status) return;

    setIsUpdating(true);
    setError(null);

    try {
      // Verificar sesión primero
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Actualizar en Supabase
      const { data, error: updateError } = await supabase
        .from('audit_activities')
        .update({ validation_status: newStatus })
        .eq('id', activityId)
        .select()
        .single();

      if (updateError) {
        console.error('Error detallado de Supabase:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        });
        throw updateError;
      }

      setStatus(newStatus);
      onStatusChange?.(newStatus || '');
    } catch (err) {
      console.error('Error actualizando validación:', err);
      setError('Error al actualizar');
      setStatus(currentStatus?.toLowerCase() as ValidationStatus || null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Si no puede editar, solo mostrar badge
  if (!canEdit) {
    const getStatusBadge = () => {
      if (!status || status === 'pendiente') {
        return (
          <Badge variant="secondary" className="capitalize">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700 capitalize">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Cumplido
        </Badge>
      );
    };

    return (
      <div className={cn('flex items-center', className)}>
        {getStatusBadge()}
      </div>
    );
  }

  // Si puede editar, mostrar botones interactivos
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleStatusChange('pendiente')}
          disabled={isUpdating || status === 'pendiente'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            'border',
            status === 'pendiente'
              ? 'bg-secondary border-secondary text-secondary-foreground'
              : 'bg-background border-input hover:bg-muted',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <Clock className="h-3 w-3" />
          Pendiente
        </button>
        <button
          onClick={() => handleStatusChange('cumplido')}
          disabled={isUpdating || status === 'cumplido'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            'border',
            status === 'cumplido'
              ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
              : 'bg-background border-input hover:bg-green-50',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
          Cumplido
        </button>
      </div>
      {isUpdating && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader variant="cube" size={12} />
          <span>Actualizando...</span>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

