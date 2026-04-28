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
import type { Auditoria } from '@/types/auditorias';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

export default function AuditoriasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<AuditActivity | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null);
  const [auditorTab, setAuditorTab] = useState<'asignadas' | 'proceso'>('asignadas');

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

      {/* Secciones */}
      <div className="grid gap-6">
        {/* Vista específica para AUDITOR: 2 secciones */}
        {userRole === 'auditor' ? (
          <>
            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold">Mis Auditorías (Auditor)</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant={auditorTab === 'asignadas' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAuditorTab('asignadas')}
                  >
                    Auditorías Asignadas
                  </Button>
                  <Button
                    variant={auditorTab === 'proceso' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAuditorTab('proceso')}
                    disabled={!selectedAuditoria}
                    title={!selectedAuditoria ? 'Selecciona una auditoría primero' : undefined}
                  >
                    Proceso de Auditoría
                  </Button>
                </div>
              </div>

              {auditorTab === 'asignadas' ? (
                <ListaAuditorias
                  key={`auditorias-asignadas-${refreshKey}`}
                  userId={user.id}
                  mode="todas"
                  selectedAuditoriaId={selectedAuditoria?.id ?? null}
                  onSelectAuditoria={(aud) => {
                    setSelectedAuditoria(aud);
                    setAuditorTab('proceso');
                  }}
                />
              ) : null}
            </section>

            {auditorTab === 'proceso' ? (
              <section>
                <h2 className="text-lg font-semibold mb-4">Proceso de Auditoría</h2>
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="border-b bg-card/60 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {selectedAuditoria
                      ? `Auditoría seleccionada`
                      : 'Selecciona una auditoría asignada'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedAuditoria
                      ? `ID: ${selectedAuditoria.id}`
                      : 'Haz clic en una auditoría para ver su avance por etapas.'}
                  </p>
                </div>

                <div className="p-4">
                  {selectedAuditoria ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Estado actual:</span>
                        <Badge variant="secondary">{selectedAuditoria.estado}</Badge>
                      </div>

                      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {([
                          { key: 'PLANIFICADA', label: 'Planificación' },
                          { key: 'EN_PREPARACION', label: 'Preparación' },
                          { key: 'EN_EJECUCION', label: 'Ejecución' },
                          { key: 'EN_REPORTE', label: 'Reporte' },
                          { key: 'CERRADA', label: 'Cierre' },
                        ] as const).map((step) => {
                          const order: Record<string, number> = {
                            PLANIFICADA: 1,
                            EN_PREPARACION: 2,
                            EN_EJECUCION: 3,
                            EN_REPORTE: 4,
                            CERRADA: 5,
                          };
                          const current = order[selectedAuditoria.estado] ?? 1;
                          const idx = order[step.key];
                          const status =
                            idx < current ? 'done' : idx === current ? 'current' : 'todo';

                          return (
                            <li
                              key={step.key}
                              className={[
                                'rounded-lg border p-3',
                                status === 'done' ? 'bg-primary/5 border-primary/20' : '',
                                status === 'current' ? 'bg-accent/60 border-primary/30 ring-1 ring-primary/10' : '',
                              ].join(' ')}
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {step.label}
                              </p>
                              <p className="text-sm font-medium text-foreground mt-1">
                                {status === 'done'
                                  ? 'Completado'
                                  : status === 'current'
                                    ? 'En curso'
                                    : 'Pendiente'}
                              </p>
                            </li>
                          );
                        })}
                      </ol>

                      <p className="text-xs text-muted-foreground">
                        Para trabajar la auditoría, vuelve a “Auditorías Asignadas” y presiona “Abrir”, o navega al detalle desde la lista.
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No hay auditoría seleccionada.
                    </div>
                  )}
                </div>
              </div>
              </section>
            ) : null}
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
