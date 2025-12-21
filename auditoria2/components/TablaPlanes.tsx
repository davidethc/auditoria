'use client';

import { cn } from '@/lib/utils';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

export interface AuditPlan {
  id: string;
  year: number;
  plan_type: string;
  description: string | null;
}

interface TablaPlanesProps {
  plans: AuditPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (plan: AuditPlan) => void;
  userRole: UserRole | null;
  isLoading?: boolean;
}

export function TablaPlanes({
  plans,
  selectedPlanId,
  onSelectPlan,
  userRole,
  isLoading,
}: TablaPlanesProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Cargando planes...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No se encontraron planes de trabajo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Año
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Tipo de Plan
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <tr
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  className={cn(
                    'border-b transition-colors cursor-pointer',
                    'hover:bg-muted/50',
                    isSelected && 'bg-secondary'
                  )}
                >
                  <td className="p-4 align-middle">
                    <span className="font-medium">{plan.year}</span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="text-sm">{plan.plan_type}</span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="text-sm text-muted-foreground">
                      {plan.description || (
                        <span className="italic">Sin descripción</span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

