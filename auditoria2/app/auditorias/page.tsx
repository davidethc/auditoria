'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, FileText } from 'lucide-react';
import { ListaActividadesAuditor } from '@/components/ListaActividadesAuditor';
import { CrearAuditoriaModal } from '@/components/CrearAuditoriaModal';
import { ListaAuditorias } from '@/components/ListaAuditorias';
import { ListaAuditoriasParticipante } from '@/components/ListaAuditoriasParticipante';
import type { AuditActivity } from '@/components/TablaActividades';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

export default function AuditoriasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<AuditActivity | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verificar rol del usuario
  useEffect(() => {
    const checkUserRole = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setIsCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error verificando rol:', error);
        setIsCheckingRole(false);
        return;
      }

      if (data) {
        setUserRole(data.role as UserRole);
      }
      setIsCheckingRole(false);
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [authLoading]);

  const handleCrearAuditoria = (activity: AuditActivity) => {
    setSelectedActivity(activity);
  };

  const handleCloseModal = () => {
    setSelectedActivity(null);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedActivity(null);
  };

  // Loading states
  if (authLoading || isCheckingRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader variant="cube" size={48}>
          <span className="text-sm text-muted-foreground mt-4">Cargando...</span>
        </Loader>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Debes iniciar sesión para acceder.
        </p>
      </div>
    );
  }

  // Vista para AUDITADOS (solo ven auditorías donde son participantes)
  if (userRole === 'auditado') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Auditorías</h1>
            <p className="text-sm text-muted-foreground">
              Auditorías donde participas
            </p>
          </div>
        </div>

        {/* Lista de auditorías donde es participante */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Auditorías Asignadas</h2>
          <ListaAuditoriasParticipante
            key={`auditorias-participante-${refreshKey}`}
            userId={user.id}
          />
        </section>
      </div>
    );
  }

  // Vista para AUDITORES y AUDITORES INTERNOS
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Auditorías</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus auditorías y prepara planes de trabajo
            </p>
          </div>
        </div>
      </div>

      {/* Tabs o secciones */}
      <div className="grid gap-6">
        {/* Sección: Actividades asignadas */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Actividades Asignadas</h2>
          <ListaActividadesAuditor
            key={`activities-${refreshKey}`}
            onCrearAuditoria={handleCrearAuditoria}
            userId={user.id}
          />
        </section>

        {/* Sección: Auditorías creadas */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Auditorías Creadas</h2>
          <ListaAuditorias
            key={`auditorias-${refreshKey}`}
            userId={user.id}
          />
        </section>
      </div>

      {/* Modal para crear auditoría */}
      {selectedActivity && (
        <CrearAuditoriaModal
          activity={selectedActivity}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          userId={user.id}
        />
      )}
    </div>
  );
}
