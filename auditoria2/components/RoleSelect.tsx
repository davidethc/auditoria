'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Loader } from '@/components/ui/loader';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

interface RoleSelectProps {
  userId: string;
  currentRole: UserRole;
  onRoleChange?: (newRole: UserRole) => void;
  className?: string;
}

export function RoleSelect({ userId, currentRole, onRoleChange, className }: RoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) return;

    setIsUpdating(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setSelectedRole(newRole);
      onRoleChange?.(newRole);
      
      // Mostrar toast de éxito
      const roleNames: Record<UserRole, string> = {
        auditado: 'Auditado',
        auditor: 'Auditor',
        auditor_interno: 'Auditor Interno',
      };
      
      toast.success('Rol actualizado correctamente', {
        description: `El rol se ha cambiado a "${roleNames[newRole]}"`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el rol';
      setError(errorMessage);
      setSelectedRole(currentRole);
      
      // Mostrar toast de error
      toast.error('Error al actualizar', {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <select
        value={selectedRole}
        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
        disabled={isUpdating}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          error && 'border-destructive'
        )}
      >
        <option value="auditado">Auditado</option>
        <option value="auditor">Auditor</option>
        <option value="auditor_interno">Auditor Interno</option>
      </select>
      {isUpdating && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader variant="cube" size={12} />
          <span>Actualizando...</span>
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

