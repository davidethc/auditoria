'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { TablaPlanes, type AuditPlan } from '@/components/TablaPlanes';
import { TablaActividades, type AuditActivity } from '@/components/TablaActividades';
import { Loader } from '@/components/ui/loader';
import { ClipboardList, AlertCircle } from 'lucide-react';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

export default function PlanTrabajoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  
  // Estados para planes
  const [plans, setPlans] = useState<AuditPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<AuditPlan | null>(null);
  
  // Estados para actividades
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // DEBUG: Estado para mostrar errores
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 1️⃣ Verificar rol del usuario
  useEffect(() => {
    const checkUserRole = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        console.log('❌ No hay sesión');
        setDebugInfo('No hay sesión activa');
        setIsCheckingRole(false);
        return;
      }

      console.log('✅ Sesión encontrada:', session.user.id);

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error verificando rol:', error);
        setDebugInfo(`Error verificando rol: ${error.message}`);
        setIsCheckingRole(false);
        return;
      }

      if (!data) {
        console.log('⚠️ Usuario no encontrado en tabla users');
        setDebugInfo('Usuario no encontrado en tabla users');
        setIsCheckingRole(false);
        return;
      }

      console.log('✅ Rol del usuario:', data.role);
      setUserRole(data.role as UserRole);
      setIsCheckingRole(false);
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [authLoading]);

  // 2️⃣ Cargar planes según el rol
  useEffect(() => {
    const loadPlans = async () => {
      if (!userRole) return;

      console.log('📋 Cargando planes para rol:', userRole);
      setIsLoadingPlans(true);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          setIsLoadingPlans(false);
          return;
        }

        let query = supabase
          .from('audit_plans')
          .select('*');

        // Si es auditor o auditado, solo mostrar planes donde tienen actividades asignadas
        if (userRole !== 'auditor_interno') {
          // Cargar planes que tienen actividades asignadas a este usuario
          const { data: activitiesData } = await supabase
            .from('audit_activities')
            .select('plan_id')
            .eq('auditor_id', session.user.id);

          const planIds = activitiesData?.map(a => a.plan_id) || [];
          
          if (planIds.length === 0) {
            setPlans([]);
            setIsLoadingPlans(false);
            console.log('⚠️ No hay planes con actividades asignadas a este usuario');
            return;
          }

          query = query.in('id', planIds);
        }

        const { data, error, status } = await query.order('year', { ascending: false });

        console.log('📊 Respuesta de Supabase:', { data, error, status });

        if (error) {
          console.error('❌ Error cargando planes:', error);
          setDebugInfo(`Error cargando planes: ${error.message} (código: ${error.code})`);
          setPlans([]);
          return;
        }

        if (!data || data.length === 0) {
          if (userRole !== 'auditor_interno') {
            console.log('⚠️ No hay planes con actividades asignadas a este usuario');
            setDebugInfo('No tienes actividades asignadas aún. El auditor interno te asignará actividades pronto.');
          } else {
            console.log('⚠️ No se encontraron planes en la BD');
            setDebugInfo('No hay planes en la base de datos');
          }
          setPlans([]);
          return;
        }

        console.log(`✅ ${data.length} planes cargados:`, data);
        setPlans(data || []);
        setDebugInfo('');
      } catch (err) {
        console.error('❌ Error inesperado:', err);
        setDebugInfo(`Error inesperado: ${err}`);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    if (!isCheckingRole && userRole) {
      loadPlans();
    }
  }, [userRole, isCheckingRole]);

  // 3️⃣ Cargar actividades cuando se selecciona un plan
  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedPlan || !userRole) return;

      console.log('📝 Cargando actividades para plan:', selectedPlan.id);
      setIsLoadingActivities(true);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) return;

        // Query con TODAS las columnas
        let query = supabase
          .from('audit_activities')
          .select(`
            id,
            activity_number,
            activity_description,
            activity_type,
            regulation_code,
            regulation_name,
            regulation_date,
            priority,
            validation_status,
            start_date,
            end_date,
            component,
            subcomponent,
            year,
            auditor_id,
            users:auditor_id(full_name, email)
          `)
          .eq('plan_id', selectedPlan.id);

        // IMPORTANTE: Si es auditor o auditado, solo ver actividades asignadas a él
        if (userRole !== 'auditor_interno') {
          query = query.eq('auditor_id', session.user.id);
        }

        const { data, error, status } = await query.order('activity_number', { ascending: true });

        console.log('📊 Respuesta actividades:', { data, error, status });

        if (error) {
          console.error('❌ Error cargando actividades:', error);
          setDebugInfo(`Error cargando actividades: ${error.message} (código: ${error.code})`);
          setActivities([]);
          return;
        }

        if (!data || data.length === 0) {
          if (userRole !== 'auditor_interno') {
            console.log('⚠️ No tienes actividades asignadas en este plan');
            setDebugInfo('No tienes actividades asignadas en este plan. El auditor interno te asignará actividades pronto.');
          } else {
            console.log('⚠️ No se encontraron actividades para este plan');
          }
          setActivities([]);
          return;
        }

        console.log(`✅ ${data.length} actividades cargadas:`, data);

        // Formatear datos con TODAS las columnas
        const formattedActivities: AuditActivity[] = (data || []).map((act) => {
          // Manejar users que puede ser objeto o array
          const user = Array.isArray(act.users) ? act.users[0] : act.users;
          
          return {
            id: act.id,
            activity_number: act.activity_number,
            activity_description: act.activity_description,
            activity_type: act.activity_type,
            regulation_code: act.regulation_code,
            regulation_name: act.regulation_name,
            regulation_date: act.regulation_date,
            priority: act.priority,
            validation_status: act.validation_status,
            start_date: act.start_date,
            end_date: act.end_date,
            component: act.component,
            subcomponent: act.subcomponent,
            year: act.year,
            auditor_id: act.auditor_id,
            auditor_name: user?.full_name || user?.email || null,
          };
        });

        setActivities(formattedActivities);
        setDebugInfo('');
      } catch (err) {
        console.error('❌ Error inesperado:', err);
        setDebugInfo(`Error inesperado: ${err}`);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    loadActivities();
  }, [selectedPlan, userRole]);

  // 4️⃣ Manejar selección de plan
  const handleSelectPlan = (plan: AuditPlan) => {
    console.log('🎯 Plan seleccionado:', plan);
    setSelectedPlan(plan);
  };

  // 5️⃣ Manejar actualización de responsable o validación
  const handleActivityUpdate = (activityId: string, newResponsableId: string, newResponsableName: string) => {
    console.log('✏️ Actualizando actividad:', { activityId, newResponsableId, newResponsableName });
    setActivities((prevActivities) =>
      prevActivities.map((activity) =>
        activity.id === activityId
          ? { ...activity, auditor_id: newResponsableId, auditor_name: newResponsableName }
          : activity
      )
    );
  };

  // 6️⃣ Manejar actualización de validación
  const handleValidacionUpdate = (activityId: string, newStatus: string) => {
    console.log('✅ Actualizando validación:', { activityId, newStatus });
    setActivities((prevActivities) =>
      prevActivities.map((activity) =>
        activity.id === activityId
          ? { ...activity, validation_status: newStatus }
          : activity
      )
    );
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

  if (!user || !userRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No se pudo cargar la información del usuario.</p>
        {debugInfo && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg max-w-md">
            <p className="text-xs text-destructive font-mono">{debugInfo}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plan de Trabajo</h1>
            <p className="text-sm text-muted-foreground">
              {userRole === 'auditor_interno'
                ? 'Gestiona y asigna actividades del plan de trabajo'
                : 'Consulta tus actividades asignadas'}
            </p>
          </div>
        </div>
      </div>

      {/* DEBUG INFO */}
      {debugInfo && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-mono">{debugInfo}</p>
          <p className="text-xs text-yellow-600 mt-2">
            Abre la consola del navegador (F12) para más detalles
          </p>
        </div>
      )}

      {/* User Info DEBUG */}
      <div className="p-4 bg-muted/50 rounded-lg text-xs font-mono">
        <p><strong>Usuario:</strong> {user.email}</p>
        <p><strong>Rol:</strong> {userRole}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      {/* Tabla de Planes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Planes de Auditoría {isLoadingPlans && '(cargando...)'}
        </h2>
        <TablaPlanes
          plans={plans}
          selectedPlanId={selectedPlan?.id || null}
          onSelectPlan={handleSelectPlan}
          userRole={userRole}
          isLoading={isLoadingPlans}
        />
        {!isLoadingPlans && plans.length === 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {userRole === 'auditor_interno' ? (
              <>
                <p className="text-sm text-blue-800">
                  💡 <strong>No hay planes visibles.</strong> Esto puede deberse a:
                </p>
                <ul className="text-xs text-blue-700 mt-2 ml-6 list-disc space-y-1">
                  <li>No hay planes creados en la base de datos</li>
                  <li>Las políticas RLS están bloqueando el acceso</li>
                </ul>
              </>
            ) : (
              <p className="text-sm text-blue-800">
                💡 <strong>No tienes actividades asignadas aún.</strong> El auditor interno te asignará actividades pronto. 
                Una vez asignadas, aparecerán aquí los planes correspondientes.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabla de Actividades (solo se muestra si hay un plan seleccionado) */}
      {selectedPlan && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              Actividades del Plan {selectedPlan.year} - {selectedPlan.plan_type}
            </h2>
            <span className="text-sm text-muted-foreground">
              {activities.length} actividad{activities.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <TablaActividades
            activities={activities}
            userRole={userRole}
            onActivityUpdate={handleActivityUpdate}
            onValidacionUpdate={handleValidacionUpdate}
            isLoading={isLoadingActivities}
          />
        </div>
      )}

      {/* Mensaje cuando no hay plan seleccionado */}
      {!selectedPlan && !isLoadingPlans && plans.length > 0 && (
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            👆 Selecciona un plan de la tabla superior para ver {userRole === 'auditor_interno' ? 'sus actividades' : 'tus actividades asignadas'}
          </p>
        </div>
      )}

      {/* Mensaje cuando hay plan seleccionado pero no hay actividades (solo para auditor/auditado) */}
      {selectedPlan && !isLoadingActivities && activities.length === 0 && userRole !== 'auditor_interno' && (
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-6 text-center">
          <p className="text-sm text-blue-800">
            📋 <strong>No tienes actividades asignadas en este plan.</strong>
          </p>
          <p className="text-xs text-blue-600 mt-2">
            El auditor interno te asignará actividades pronto. Una vez asignadas, aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  );
}
