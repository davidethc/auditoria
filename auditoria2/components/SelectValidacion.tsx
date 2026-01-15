'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Mail, AlertCircle } from 'lucide-react';

interface SelectValidacionProps {
  activityId: string;
  currentStatus: string | null;
  onStatusChange?: (newStatus: string) => void;
  canEdit: boolean; // Solo auditor puede editar su validación
  canNotify?: boolean; // Solo auditor_interno puede notificar
  className?: string;
  activityData?: {
    activity_number?: number;
    activity_description?: string;
    auditor_id?: string | null;
    auditor_email?: string | null;
    auditor_name?: string | null;
  };
}

type ValidationStatus = 'cumplido' | 'pendiente' | null;

export function SelectValidacion({
  activityId,
  currentStatus,
  onStatusChange,
  canEdit,
  canNotify = false,
  className,
  activityData,
}: SelectValidacionProps) {
  const [status, setStatus] = useState<ValidationStatus>(
    (currentStatus?.toLowerCase() as ValidationStatus) || null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifySuccess, setNotifySuccess] = useState(false);

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

  const handleNotify = async () => {
    if (!activityData?.auditor_id || !activityData?.auditor_email) {
      setError('No hay auditor asignado o no tiene email');
      return;
    }

    setIsNotifying(true);
    setError(null);
    setNotifySuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Llamar API route que notifica vía N8N
      const response = await fetch('/api/notificar-auditor-actividad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId,
          activity_number: activityData.activity_number,
          activity_description: activityData.activity_description,
          auditor_id: activityData.auditor_id,
          auditor_email: activityData.auditor_email,
          auditor_name: activityData.auditor_name,
          validation_status: status || 'pendiente',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar notificación');
      }

      setNotifySuccess(true);
      setTimeout(() => setNotifySuccess(false), 3000);
    } catch (err) {
      console.error('Error enviando notificación:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar correo');
    } finally {
      setIsNotifying(false);
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
    <div className={cn('flex flex-col gap-2', className)}>
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

      {/* Botón Notificar por Correo (solo auditor_interno) */}
      {canNotify && activityData?.auditor_email && (
        <Button
          onClick={handleNotify}
          disabled={isNotifying || !activityData.auditor_id}
          size="sm"
          variant="outline"
          className="w-full text-xs h-7"
          title={!activityData.auditor_id ? 'Primero asigna un responsable' : `Enviar correo a ${activityData.auditor_email}`}
        >
          {isNotifying ? (
            <>
              <Loader variant="cube" size={12} className="mr-1" />
              Enviando...
            </>
          ) : notifySuccess ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
              Enviado
            </>
          ) : (
            <>
              <Mail className="h-3 w-3 mr-1" />
              Notificar por Correo
            </>
          )}
        </Button>
      )}

      {isUpdating && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader variant="cube" size={12} />
          <span>Actualizando...</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notifySuccess && !error && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3" />
          <span>Correo enviado exitosamente</span>
        </div>
      )}
    </div>
  );
}

