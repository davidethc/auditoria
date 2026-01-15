'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, FileText, FileDown, Loader2 } from 'lucide-react';
import { FormularioInformeBorrador } from '@/components/FormularioInformeBorrador';
import { RevisorInforme } from '@/components/RevisorInforme';
import { SocializacionInforme } from '@/components/SocializacionInforme';
import { DescargosForm } from '@/components/DescargosForm';
import { EstrategiaForm } from '@/components/EstrategiaForm';
import { FirmasInforme } from '@/components/FirmasInforme';
import type { AuditoriaInforme, AuditoriaCompleta, AuditoriaObservacion, AuditoriaParticipante } from '@/types/auditorias';
import { formatearFecha } from '@/utils/auditoriaHelpers';

export default function InformePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [auditoria, setAuditoria] = useState<AuditoriaCompleta | null>(null);
  const [informe, setInforme] = useState<AuditoriaInforme | null>(null);
  const [observaciones, setObservaciones] = useState<AuditoriaObservacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('borrador');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  useEffect(() => {
    if (params.id && user) {
      loadUserRole();
      loadData();
    }
  }, [params.id, user]);

  const loadUserRole = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserRole(data.role);
      }
    } catch (err) {
      console.error('Error cargando rol:', err);
    }
  };

  const handleGenerarWord = async () => {
    if (!informe?.id) {
      alert('No hay informe para generar');
      return;
    }

    setIsGeneratingWord(true);
    setError(null);

    try {
      console.log('📤 Generando Word para informe:', informe.id);

      const response = await fetch('/api/generar-word-informe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ informe_id: informe.id }),
      });

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('❌ Error parseando JSON:', parseError, 'Texto recibido:', text);
          throw new Error(`Respuesta inválida del servidor: ${text.substring(0, 100)}`);
        }
      } else {
        const text = await response.text();
        console.error('❌ Respuesta no es JSON:', text);
        throw new Error(`Error del servidor: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      if (data.success) {
        alert('✅ Documento Word generado correctamente. Revisa Google Drive y N8N para ver el resultado.');
        // Recargar datos para ver documento_word_url actualizado
        await loadData();
      } else {
        throw new Error(data.error || 'Error al generar Word');
      }
    } catch (err) {
      console.error('❌ Error generando Word:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al generar Word';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar auditoría
      const { data: auditoriaData, error: auditoriaError } = await supabase
        .from('auditorias')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (auditoriaError) throw auditoriaError;
      if (!auditoriaData) {
        setError('Auditoría no encontrada');
        setIsLoading(false);
        return;
      }

      setAuditoria(auditoriaData as any);

      // Cargar informe actual
      const { data: informeData, error: informeError } = await supabase
        .from('auditoria_informe')
        .select('*')
        .eq('auditoria_id', params.id)
        .eq('es_version_actual', true)
        .maybeSingle();

      if (informeError) throw informeError;
      setInforme(informeData as AuditoriaInforme | null);

      // Cargar observaciones
      const { data: observacionesData, error: obsError } = await supabase
        .from('auditoria_observaciones')
        .select('*')
        .eq('auditoria_id', params.id)
        .order('numero_observacion', { ascending: true });

      if (obsError) throw obsError;
      setObservaciones(observacionesData || []);

      // Determinar tab activo según estado
      if (informeData) {
        const estado = informeData.estado;
        if (estado === 'BORRADOR' || estado === 'CON_CORRECCIONES') {
          setActiveTab('borrador');
        } else if (estado === 'EN_REVISION') {
          setActiveTab('revision');
        } else if (estado === 'APROBADO' || estado === 'SOCIALIZADO') {
          setActiveTab('socializacion');
        } else if (estado === 'ENVIADO_A_AUDITADOS') {
          setActiveTab('final');
        } else {
          setActiveTab('borrador');
        }
      } else {
        setActiveTab('borrador');
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipantes = async (): Promise<AuditoriaParticipante[]> => {
    try {
      const { data, error } = await supabase
        .from('auditoria_participantes')
        .select(`
          *,
          user:users!auditoria_participantes_user_id_fkey (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('auditoria_id', params.id);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error cargando participantes:', err);
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader variant="cube" size={48}>
          <span className="text-sm text-muted-foreground mt-4">Cargando...</span>
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

  const puedeEditar = userRole === 'auditor' || userRole === 'auditor_interno';
  const esAuditado = userRole === 'auditado';
  const esAuditorInterno = userRole === 'auditor_interno';

  // Verificar que la auditoría esté en un estado válido para crear informe
  if (!auditoria) {
    return null; // Aún cargando
  }

  // Solo bloquear si NO está en estados válidos Y no hay informe
  // PERO permitir acceso si ya hay un informe (para verlo)
  const estadoValidoParaInforme = auditoria.estado === 'EN_REPORTE' || auditoria.estado === 'CERRADA';
  
  if (!estadoValidoParaInforme && !informe) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
          <div className="flex items-start gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Estado de auditoría: {auditoria.estado}</p>
              <p className="text-sm">
                {auditoria.estado === 'PLANIFICADA' || auditoria.estado === 'EN_PREPARACION' 
                  ? 'Primero debes completar la preparación y notificar a los auditados, luego iniciar la ejecución.'
                  : auditoria.estado === 'EN_EJECUCION'
                  ? 'Debes finalizar la ejecución primero. Ve a la sección de Ejecución y haz clic en "Finalizar Ejecución".'
                  : 'No se puede crear un informe en este estado.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determinar qué mostrar según estado y rol
  const mostrarBorrador = informe && (informe.estado === 'BORRADOR' || informe.estado === 'CON_CORRECCIONES');
  const mostrarRevision = informe && informe.estado === 'EN_REVISION' && esAuditorInterno;
  const mostrarSocializacion = informe && (informe.estado === 'APROBADO' || informe.estado === 'SOCIALIZADO');
  const mostrarDescargos = informe && informe.estado === 'SOCIALIZADO' && esAuditado;
  const mostrarFinal = informe && informe.estado === 'ENVIADO_A_AUDITADOS';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Informe de Auditoría</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {informe ? `Estado: ${informe.estado}` : 'Crear nuevo informe borrador'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {informe && (
            <>
              <Badge variant="outline">
                Versión {informe.version}
              </Badge>
              {puedeEditar && (
                <Button
                  onClick={handleGenerarWord}
                  disabled={isGeneratingWord || !informe}
                  variant="default"
                  className="gap-2"
                >
                  {isGeneratingWord ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4" />
                      Generar Word
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs según estado */}
      {informe && (
        <div className="border-b">
          <div className="flex gap-4">
            {mostrarBorrador && puedeEditar && (
              <button
                onClick={() => setActiveTab('borrador')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'borrador'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                {informe.estado === 'CON_CORRECCIONES' ? 'Corregir Borrador' : 'Borrador'}
              </button>
            )}
            {mostrarRevision && (
              <button
                onClick={() => setActiveTab('revision')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'revision'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Revisar
              </button>
            )}
            {mostrarSocializacion && puedeEditar && (
              <button
                onClick={() => setActiveTab('socializacion')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'socializacion'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Socialización
              </button>
            )}
            {mostrarDescargos && (
              <button
                onClick={() => setActiveTab('descargos')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'descargos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Descargos
              </button>
            )}
            {mostrarFinal && (
              <button
                onClick={() => setActiveTab('final')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'final'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Informe Final
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contenido según tab */}
      <div>
        {/* Mostrar formulario para crear informe si no existe y está en estado correcto */}
        {!informe && estadoValidoParaInforme && (
          <div className="space-y-4">
            {/* Mostrar formulario si es auditor o si aún no se ha cargado el rol (para evitar bloqueo prematuro) */}
            {(!userRole || puedeEditar) ? (
              <FormularioInformeBorrador
                auditoriaId={auditoria.id}
                informe={null}
                onSuccess={loadData}
                currentUserId={user?.id || ''}
              />
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Solo los auditores pueden crear informes. Tu rol actual: {userRole || 'cargando...'}
                </p>
              </div>
            )}
          </div>
        )}

        {mostrarBorrador && activeTab === 'borrador' && puedeEditar && (
          <FormularioInformeBorrador
            auditoriaId={auditoria.id}
            informe={informe}
            onSuccess={loadData}
            currentUserId={user?.id || ''}
          />
        )}

        {mostrarRevision && activeTab === 'revision' && esAuditorInterno && informe && (
          <RevisorInforme
            informe={informe}
            onSuccess={loadData}
            currentUserId={user?.id || ''}
          />
        )}

        {mostrarSocializacion && activeTab === 'socializacion' && puedeEditar && informe && (
          <SocializacionInformeWrapper
            informe={informe}
            auditoriaId={auditoria.id}
            onSuccess={loadData}
          />
        )}

        {mostrarDescargos && activeTab === 'descargos' && esAuditado && (
          <DescargosForm
            auditoriaId={auditoria.id}
            observaciones={observaciones}
            currentUserId={user?.id || ''}
            readOnly={false}
          />
        )}

        {mostrarFinal && activeTab === 'final' && informe && (
          <InformeFinalWrapper
            informe={informe}
            auditoriaId={auditoria.id}
            observaciones={observaciones}
            onSuccess={loadData}
            currentUserId={user?.id || ''}
            userRole={userRole || ''}
          />
        )}

        {!informe && !puedeEditar && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              El informe aún no ha sido creado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componentes wrapper para cargar datos adicionales
function SocializacionInformeWrapper({ informe, auditoriaId, onSuccess }: any) {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadParticipantes();
  }, []);

  const loadParticipantes = async () => {
    try {
      // Cargar participantes primero
      const { data: participantesData, error: partError } = await supabase
        .from('auditoria_participantes')
        .select('*')
        .eq('auditoria_id', auditoriaId);

      if (partError) throw partError;

      if (!participantesData || participantesData.length === 0) {
        setParticipantes([]);
        setIsLoading(false);
        return;
      }

      // Obtener IDs de usuarios
      const userIds = participantesData.map(p => p.user_id).filter(Boolean);

      if (userIds.length === 0) {
        setParticipantes(participantesData.map(p => ({ ...p, user: null })));
        setIsLoading(false);
        return;
      }

      // Cargar usuarios por separado
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Crear mapa de usuarios
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, { id: string; full_name: string | null; email: string; role: string }>);

      // Combinar datos
      const participantesCompletos = participantesData.map(p => ({
        ...p,
        user: usersMap[p.user_id] || null,
      }));

      setParticipantes(participantesCompletos);
    } catch (err) {
      console.error('Error cargando participantes:', err);
      setParticipantes([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader variant="cube" size={32} />;
  }

  return (
    <SocializacionInforme
      informe={informe}
      participantes={participantes}
      onSuccess={onSuccess}
    />
  );
}

function InformeFinalWrapper({ informe, auditoriaId, observaciones, onSuccess, currentUserId, userRole }: any) {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [elaboradoPorUser, setElaboradoPorUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar participantes primero
      const { data: partData, error: partError } = await supabase
        .from('auditoria_participantes')
        .select('*')
        .eq('auditoria_id', auditoriaId);

      if (partError) throw partError;

      if (partData && partData.length > 0) {
        // Obtener IDs de usuarios
        const userIds = partData.map(p => p.user_id).filter(Boolean);

        if (userIds.length > 0) {
          // Cargar usuarios por separado
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .in('id', userIds);

          if (usersError) throw usersError;

          // Crear mapa de usuarios
          const usersMap = (usersData || []).reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, { id: string; full_name: string | null; email: string; role: string }>);

          // Combinar datos
          const participantesCompletos = partData.map(p => ({
            ...p,
            user: usersMap[p.user_id] || null,
          }));

          setParticipantes(participantesCompletos);
        } else {
          setParticipantes(partData.map(p => ({ ...p, user: null })));
        }
      } else {
        setParticipantes([]);
      }

      // Cargar usuario que elaboró
      if (informe.elaborado_por) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', informe.elaborado_por)
          .maybeSingle();

        setElaboradoPorUser(userData);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setParticipantes([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader variant="cube" size={32} />;
  }

  const esAuditado = userRole === 'auditado';
  const esAuditor = userRole === 'auditor' || userRole === 'auditor_interno';

  return (
    <div className="space-y-6">
      {/* Solo el auditado puede completar la estrategia */}
      {esAuditado && (
        <EstrategiaForm
          informe={informe}
          onSuccess={onSuccess}
          currentUserId={currentUserId}
          readOnly={false}
        />
      )}

      {/* El auditor puede ver la estrategia pero no editarla */}
      {esAuditor && !esAuditado && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Estrategia de Implementación</h3>
            <p className="text-sm text-muted-foreground">
              La estrategia y fechas de implementación las define el auditado. Solo puedes verlas.
            </p>
          </div>
          {informe.estrategia ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estrategia</label>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {informe.estrategia}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha de Inicio</label>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {informe.fecha_inicio_implementacion 
                      ? new Date(informe.fecha_inicio_implementacion).toLocaleDateString('es-ES')
                      : 'No definida'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha de Fin</label>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {informe.fecha_fin_implementacion 
                      ? new Date(informe.fecha_fin_implementacion).toLocaleDateString('es-ES')
                      : 'No definida'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Entregable</label>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {informe.entregable || 'No definido'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏳ El auditado aún no ha completado la estrategia de implementación.
              </p>
            </div>
          )}
        </div>
      )}

      <FirmasInforme
        informe={informe}
        participantes={participantes}
        elaboradoPorUser={elaboradoPorUser}
        onSuccess={onSuccess}
        currentUserId={currentUserId}
        readOnly={false}
      />
    </div>
  );
}

