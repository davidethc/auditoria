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
import type { Auditoria, AuditoriaEstado } from '@/types/auditorias';
import { useSearchParams } from 'next/navigation';

const estadoConfig: Record<string, { label: string }> = {
  PLANIFICADA: { label: 'Planificada' },
  EN_PREPARACION: { label: 'En Preparación' },
  EN_EJECUCION: { label: 'En Ejecución' },
  EN_REPORTE: { label: 'En Reporte' },
  CERRADA: { label: 'Cerrada' },
};

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

export default function AuditoriasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const stage = searchParams.get('stage');
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
    const grouped = view === 'proceso';
    const stageFilter = stage as any;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {view === 'auditorias' ? 'Mis Auditorías' : view === 'proceso' ? (stage ? `${estadoConfig[stage]?.label || stage}` : 'Proceso de Auditorías') : 'Mis Auditorías'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {view === 'auditorias' ? 'Auditorías donde participas' : view === 'proceso' ? (stage ? `Auditorías en ${estadoConfig[stage]?.label || stage}` : 'Auditorías clasificadas por proceso') : 'Auditorías donde participas'}
            </p>
          </div>
        </div>

        {/* Lista de auditorías donde es participante */}
        <section>
          <ListaAuditoriasParticipante
            key={`auditorias-participante-${refreshKey}`}
            userId={user.id}
            grouped={grouped}
            stageFilter={stageFilter}
          />
        </section>
      </div>
    );
  }

  // Vista para AUDITORES y AUDITORES INTERNOS
  const grouped = view === 'proceso';
  const stageFilter = stage as AuditoriaEstado | null;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {view === 'auditorias' ? 'Mis Auditorías' : view === 'proceso' ? (stage ? `${estadoConfig[stage]?.label || stage}` : 'Proceso de Auditorías') : 'Mis Auditorías'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {view === 'auditorias' ? 'Gestiona tus auditorías y prepara planes de trabajo' : view === 'proceso' ? (stage ? `Auditorías en ${estadoConfig[stage]?.label || stage}` : 'Auditorías clasificadas por proceso') : 'Gestiona tus auditorías y prepara planes de trabajo'}
            </p>
          </div>
        </div>
      </div>

      {/* Secciones */}
      <div className="grid gap-6">
        {/* Vista específica para AUDITOR: actividades asignadas + auditorías */}
        {userRole === 'auditor' ? (
          <>
            <section>
              <h2 className="text-lg font-semibold mb-4">Actividades Asignadas</h2>
              <ListaActividadesAuditor
                key={`activities-auditor-${refreshKey}`}
                onCrearAuditoria={handleCrearAuditoria}
                userId={user.id}
              />
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Mis Auditorías</h2>
              <ListaAuditorias
                key={`auditorias-asignadas-${refreshKey}`}
                userId={user.id}
                mode="todas"
                grouped={grouped}
                stageFilter={stageFilter}
              />
            </section>
          </>
        ) : (
          <>
            {/* Vista actual para AUDITOR INTERNO */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Actividades Asignadas</h2>
              <ListaActividadesAuditor
                key={`activities-${refreshKey}`}
                onCrearAuditoria={handleCrearAuditoria}
                userId={user.id}
              />
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Auditorías Creadas</h2>
              <ListaAuditorias
                key={`auditorias-${refreshKey}`}
                userId={user.id}
                grouped={grouped}
                stageFilter={stageFilter}
              />
            </section>
          </>
        )}
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
