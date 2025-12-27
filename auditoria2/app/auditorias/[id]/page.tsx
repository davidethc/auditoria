'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { 
  ArrowLeft,
  Calendar,
  FileText,
  Users,
  Send,
  AlertCircle,
  PlayCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditoriaCompleta } from '@/types/auditorias';
import { PreparacionForm } from '@/components/PreparacionForm';
import { ParticipantesForm } from '@/components/ParticipantesForm';
import { GestorEstados } from '@/components/GestorEstados';
import { BotonNotificar } from '@/components/BotonNotificar';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

const estadoConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  PLANIFICADA: { label: 'Planificada', variant: 'outline' },
  EN_PREPARACION: { label: 'En Preparación', variant: 'secondary' },
  EN_EJECUCION: { label: 'En Ejecución', variant: 'default' },
  EN_REPORTE: { label: 'En Reporte', variant: 'default' },
  CERRADA: { label: 'Cerrada', variant: 'secondary' },
};

export default function AuditoriaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preparacion' | 'participantes' | 'comunicaciones'>('preparacion');

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        setUserRole(data.role as UserRole);
      }
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [authLoading]);

  const loadAuditoria = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Primero verificar que la auditoría existe (sin JOIN estricto)
      const { data: auditoriaData, error: auditoriaError } = await supabase
        .from('auditorias')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (auditoriaError) {
        console.error('❌ Error obteniendo auditoría:', auditoriaError);
        throw auditoriaError;
      }

      if (!auditoriaData) {
        setError('Auditoría no encontrada o no tienes permisos para verla');
        setIsLoading(false);
        return;
      }

      // Cargar actividad relacionada (puede no existir)
      const { data: activityData } = await supabase
        .from('audit_activities')
        .select('id, activity_number, activity_description, start_date, end_date, priority, component, subcomponent')
        .eq('id', auditoriaData.activity_id)
        .maybeSingle();

      // Cargar preparación (puede no existir)
      const { data: preparacionData } = await supabase
        .from('auditoria_preparacion')
        .select('*')
        .eq('auditoria_id', params.id)
        .order('preparada_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Cargar participantes (sin JOIN porque user_id referencia auth.users, no public.users)
      const { data: participantesData, error: participantesError } = await supabase
        .from('auditoria_participantes')
        .select('*')
        .eq('auditoria_id', params.id);

      if (participantesError) {
        console.error('❌ Error obteniendo participantes:', participantesError);
        // No lanzar error, continuar sin participantes
      }

      // Cargar datos de usuarios por separado
      let participantes = participantesData || [];
      if (participantes.length > 0) {
        const userIds = [...new Set(participantes.map(p => p.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .in('id', userIds);

          if (usersData) {
            const usersMap = usersData.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {} as Record<string, { id: string; full_name: string | null; email: string; role: string }>);

            // Combinar datos
            participantes = participantes.map(p => ({
              ...p,
              user: usersMap[p.user_id] || null,
            }));
          }
        }
      }

      console.log('✅ Auditoría cargada:', {
        id: auditoriaData.id,
        estado: auditoriaData.estado,
        tieneActividad: !!activityData,
        tienePreparacion: !!preparacionData,
        participantes: participantes?.length || 0
      });

      setAuditoria({
        ...auditoriaData,
        activity: activityData || undefined,
        preparacion: preparacionData || undefined,
        participantes: participantes || []
      });
    } catch (err) {
      console.error('❌ Error cargando auditoría:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar la auditoría. Verifica las políticas RLS.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id && userRole) {
      loadAuditoria();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, userRole]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader variant="cube" size={48}>
          <span className="text-sm text-muted-foreground mt-4">Cargando auditoría...</span>
        </Loader>
      </div>
    );
  }

  if (error || !auditoria) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error || 'Auditoría no encontrada'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Tipo seguro para activity
  interface ActivityData {
    id: string;
    activity_number: number;
    activity_description: string;
    start_date: string | null;
    end_date: string | null;
    priority: string | null;
    component: string | null;
    subcomponent: string | null;
  }

  const activity = (auditoria.activity as ActivityData | ActivityData[] | null) 
    ? (Array.isArray(auditoria.activity) ? auditoria.activity[0] : auditoria.activity) as ActivityData
    : null;
  
  const config = estadoConfig[auditoria.estado] || estadoConfig.PLANIFICADA;
  const preparacion = Array.isArray(auditoria.preparacion) ? auditoria.preparacion[0] : auditoria.preparacion;

  // Determinar permisos según el rol
  const esAuditorResponsable = auditoria.auditor_responsable_id === user?.id;
  const esAuditorInterno = userRole === 'auditor_interno';
  const esParticipante = auditoria.participantes?.some(
    (p) => p.user?.id === user?.id
  ) || false;
  
  // Los auditados pueden ver pero no editar
  const puedeEditar = (esAuditorResponsable || esAuditorInterno) && auditoria.estado !== 'CERRADA';
  const puedeGestionarEstados = esAuditorResponsable || esAuditorInterno;
  const puedeVer = esAuditorResponsable || esAuditorInterno || esParticipante;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Auditoría - Actividad #{activity?.activity_number}</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activity?.activity_description}
            </p>
          </div>
        </div>

        {puedeGestionarEstados && puedeVer && auditoria.estado === 'PLANIFICADA' && (
          <div className="flex gap-2">
            <BotonNotificar
              auditoria={auditoria}
              onSuccess={loadAuditoria}
            />
            <Button
              onClick={async () => {
                if (!confirm('¿Estás seguro de iniciar la ejecución? Esto cambiará el estado a EN_EJECUCION y podrás registrar observaciones.')) {
                  return;
                }
                try {
                  const { data, error } = await supabase
                    .from('auditorias')
                    .update({ 
                      estado: 'EN_EJECUCION',
                      ejecucion_iniciada: true,
                      fecha_inicio_ejecucion: new Date().toISOString()
                    })
                    .eq('id', auditoria.id)
                    .select();
                  
                  if (error) {
                    console.error('Error detallado:', error);
                    alert(`Error al cambiar el estado: ${error.message || JSON.stringify(error)}`);
                    return;
                  }
                  
                  if (data && data.length > 0) {
                    loadAuditoria();
                    alert('✅ Estado cambiado a EN_EJECUCION. Ahora puedes ver el tab de Ejecución.');
                  } else {
                    alert('⚠️ No se pudo actualizar. Verifica tus permisos.');
                  }
                } catch (err) {
                  console.error('Error:', err);
                  const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
                  alert(`Error al cambiar el estado: ${errorMessage}`);
                }
              }}
              variant="outline"
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Iniciar Ejecución
            </Button>
          </div>
        )}
        {puedeGestionarEstados && puedeVer && auditoria.estado !== 'PLANIFICADA' && (
          <GestorEstados
            auditoria={auditoria}
            onEstadoChange={loadAuditoria}
          />
        )}
      </div>

      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Fecha de Inicio</span>
          </div>
          <p className="text-lg font-semibold">{formatDate(auditoria.fecha_inicio)}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Fecha de Fin</span>
          </div>
          <p className="text-lg font-semibold">{formatDate(auditoria.fecha_fin)}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Participantes</span>
          </div>
          <p className="text-lg font-semibold">
            {auditoria.participantes?.length || 0} persona{(auditoria.participantes?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('preparacion')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'preparacion'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Preparación
          </button>
          <button
            onClick={() => setActiveTab('participantes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'participantes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Participantes
          </button>
          {auditoria.estado === 'EN_EJECUCION' && puedeEditar && (
            <button
              onClick={() => router.push(`/auditorias/${auditoria.id}/ejecucion`)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                pathname === `/auditorias/${auditoria.id}/ejecucion`
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Ejecución
            </button>
          )}
          {(auditoria.estado === 'EN_REPORTE' || auditoria.estado === 'CERRADA') && (
            <button
              onClick={() => router.push(`/auditorias/${auditoria.id}/informe`)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                pathname === `/auditorias/${auditoria.id}/informe` || pathname?.includes('/informe')
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Informe
            </button>
          )}
          <button
            onClick={() => setActiveTab('comunicaciones')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'comunicaciones'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Comunicaciones
          </button>
        </div>
      </div>

      {/* Mensajes informativos sobre el flujo según el estado */}
      {auditoria.estado === 'PLANIFICADA' && puedeEditar && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                📋 Flujo de la Auditoría:
              </p>
              <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li><strong>Preparación</strong> (actual) → Completa objetivos, alcance y criterios</li>
                <li><strong>Participantes</strong> → Agrega auditados y haz clic en &quot;Notificar Auditados&quot;</li>
                <li><strong>Iniciar Ejecución</strong> → Usa el botón &quot;Iniciar Ejecución&quot; arriba a la derecha</li>
                <li><strong>Ejecución</strong> → Aparecerá un nuevo tab para registrar observaciones</li>
                <li><strong>Informe</strong> → Aparecerá cuando finalices la ejecución</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {auditoria.estado === 'EN_REPORTE' && puedeEditar && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                ✅ Ejecución Finalizada - Siguiente Paso:
              </p>
              <p className="text-xs text-green-800 dark:text-green-200">
                La ejecución ya fue completada. Ahora debes crear el <strong>Informe Borrador</strong>. 
                Haz clic en el tab <strong>&quot;Informe&quot;</strong> arriba para comenzar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de tabs */}
      <div>
        {activeTab === 'preparacion' && (
          <PreparacionForm
            auditoriaId={auditoria.id}
            preparacion={preparacion}
            onSuccess={loadAuditoria}
            readOnly={!puedeEditar || auditoria.estado !== 'PLANIFICADA'}
          />
        )}

        {activeTab === 'participantes' && (
          <ParticipantesForm
            auditoriaId={auditoria.id}
            participantes={auditoria.participantes || []}
            onSuccess={loadAuditoria}
            readOnly={!puedeEditar}
            currentUserId={user?.id}
          />
        )}

        {activeTab === 'comunicaciones' && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Sección de comunicaciones en desarrollo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

