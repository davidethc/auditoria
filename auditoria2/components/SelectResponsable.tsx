'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

interface ResponsableUser {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
}

interface SelectResponsableProps {
  activityId: string;
  currentResponsableId: string | null;
  currentResponsableName?: string | null;
  onResponsableChange?: (newResponsableId: string, newResponsableName: string) => void;
  canEdit: boolean; // Solo auditor_interno puede asignar/cambiar responsable
  className?: string;
}

export function SelectResponsable({
  activityId,
  currentResponsableId,
  currentResponsableName,
  onResponsableChange,
  canEdit,
  className,
}: SelectResponsableProps) {
  const [responsables, setResponsables] = useState<ResponsableUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentResponsableId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuarios con rol auditor o auditado
  useEffect(() => {
    if (!canEdit) return;

    const loadResponsables = async () => {
      setIsLoadingOptions(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .in('role', ['auditor', 'auditado'])
          .order('full_name', { ascending: true });

        if (error) throw error;
        setResponsables(data || []);
      } catch (err) {
        console.error('Error cargando responsables:', err);
        setError('Error cargando usuarios');
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadResponsables();
  }, [canEdit]);

  const handleChange = async (newResponsableId: string) => {
    if (!canEdit || newResponsableId === selectedId) return;

    setIsUpdating(true);
    setError(null);

    try {
      // Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('audit_activities')
        .update({ auditor_id: newResponsableId })
        .eq('id', activityId);

      if (updateError) throw updateError;

      // Encontrar el nombre del nuevo responsable
      const newResponsable = responsables.find((r) => r.id === newResponsableId);
      const newName = newResponsable?.full_name || newResponsable?.email || 'Sin asignar';

      setSelectedId(newResponsableId);
      onResponsableChange?.(newResponsableId, newName);
    } catch (err) {
      console.error('Error actualizando responsable:', err);
      setError('Error al actualizar');
      setSelectedId(currentResponsableId);
    } finally {
      setIsUpdating(false);
    }
  };

  // Si no puede editar, solo mostrar el nombre
  if (!canEdit) {
    return (
      <div className={cn('text-sm text-foreground', className)}>
        {currentResponsableName || (
          <span className="text-muted-foreground italic">Sin asignar</span>
        )}
      </div>
    );
  }

  // Si puede editar, mostrar dropdown
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <select
        value={selectedId || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isUpdating || isLoadingOptions}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          error && 'border-destructive'
        )}
      >
        <option value="">Sin asignar</option>
        {isLoadingOptions ? (
          <option disabled>Cargando...</option>
        ) : (
          responsables.map((responsable) => (
            <option key={responsable.id} value={responsable.id}>
              {responsable.full_name || responsable.email} ({responsable.role})
            </option>
          ))
        )}
      </select>
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

