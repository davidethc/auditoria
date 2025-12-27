'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { 
  FileText, 
  Plus, 
  Link as LinkIcon, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

interface SolicitudDocumentacion {
  id: string;
  auditoria_id: string;
  titulo: string;
  descripcion: string;
  tipo_documento: string | null;
  solicitado_por: string;
  fecha_solicitud: string;
  fecha_limite: string | null;
  destinatario_id: string;
  link_drive: string | null;
  comentarios_respuesta: string | null;
  fecha_respuesta: string | null;
  estado: 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'VENCIDA';
  auditoria?: {
    id: string;
    activity?: {
      activity_number: number;
    };
  };
  solicitado_por_user?: {
    full_name: string | null;
    email: string;
  };
  destinatario_user?: {
    full_name: string | null;
    email: string;
  };
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'outline', icon: Clock },
  ENVIADA: { label: 'Enviada', variant: 'secondary', icon: CheckCircle2 },
  RECIBIDA: { label: 'Recibida', variant: 'default', icon: CheckCircle2 },
  VENCIDA: { label: 'Vencida', variant: 'destructive', icon: AlertCircle },
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudDocumentacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState<string>('');
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [participantes, setParticipantes] = useState<any[]>([]);

  // Formulario nueva solicitud
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [destinatarioId, setDestinatarioId] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario respuesta
  const [showRespuestaModal, setShowRespuestaModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudDocumentacion | null>(null);
  const [linkDrive, setLinkDrive] = useState('');
  const [comentariosRespuesta, setComentariosRespuesta] = useState('');

  useEffect(() => {
    loadUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole) {
      loadSolicitudes();
      if (userRole === 'auditor' || userRole === 'auditor_interno') {
        loadAuditorias();
      }
    }
  }, [userRole]);

  const loadUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setUserRole(data.role as UserRole);
    }
  };

  const loadAuditorias = async () => {
    try {
      // Solo cargar auditorías que tienen auditados
      const { data: participantesData, error: partError } = await supabase
        .from('auditoria_participantes')
        .select('auditoria_id')
        .eq('rol_en_auditoria', 'AUDITADO');

      if (partError) throw partError;

      const auditoriasConAuditados = [...new Set(participantesData?.map(p => p.auditoria_id) || [])];

      if (auditoriasConAuditados.length === 0) {
        setAuditorias([]);
        return;
      }

      const { data, error } = await supabase
        .from('auditorias')
        .select(`
          id,
          activity:audit_activities (
            activity_number
          )
        `)
        .eq('auditor_responsable_id', user?.id)
        .in('id', auditoriasConAuditados)
        .order('creada_at', { ascending: false });

      if (error) throw error;
      setAuditorias(data || []);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
      setAuditorias([]);
    }
  };

  const loadParticipantes = async (auditoriaId: string) => {
    try {
      const { data: participantesData, error: partError } = await supabase
        .from('auditoria_participantes')
        .select('user_id')
        .eq('auditoria_id', auditoriaId)
        .eq('rol_en_auditoria', 'AUDITADO');

      if (partError) throw partError;

      if (!participantesData || participantesData.length === 0) {
        setParticipantes([]);
        return;
      }

      const userIds = participantesData.map(p => p.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      const participantes = participantesData.map(part => ({
        user_id: part.user_id,
        user: usersData?.find(u => u.id === part.user_id) || null
      }));

      setParticipantes(participantes);
    } catch (err) {
      console.error('Error cargando participantes:', err);
      setParticipantes([]);
    }
  };

  const loadSolicitudes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('solicitudes_documentacion')
        .select('*')
        .order('fecha_solicitud', { ascending: false });

      // Filtrar según el rol
      if (userRole === 'auditado') {
        query = query.eq('destinatario_id', user?.id);
      } else if (userRole === 'auditor' || userRole === 'auditor_interno') {
        query = query.eq('solicitado_por', user?.id);
      }

      const { data: solicitudesData, error } = await query;

      if (error) throw error;

      // Cargar datos relacionados por separado
      if (solicitudesData && solicitudesData.length > 0) {
        const auditoriaIds = [...new Set(solicitudesData.map(s => s.auditoria_id))];
        const userIds = [...new Set([
          ...solicitudesData.map(s => s.solicitado_por),
          ...solicitudesData.map(s => s.destinatario_id)
        ].filter(Boolean))];

        // Cargar auditorías
        const { data: auditoriasData } = await supabase
          .from('auditorias')
          .select(`
            id,
            activity:audit_activities (
              activity_number
            )
          `)
          .in('id', auditoriaIds);

        // Cargar usuarios
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);

        const auditoriasMap = new Map(auditoriasData?.map(a => [a.id, a]) || []);
        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

        const solicitudesCompletas = solicitudesData.map(s => ({
          ...s,
          auditoria: auditoriasMap.get(s.auditoria_id),
          solicitado_por_user: usersMap.get(s.solicitado_por),
          destinatario_user: usersMap.get(s.destinatario_id),
        }));

        setSolicitudes(solicitudesCompletas);
      } else {
        setSolicitudes([]);
      }
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      setSolicitudes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearSolicitud = async () => {
    if (!titulo || !descripcion || !selectedAuditoria || !destinatarioId) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('solicitudes_documentacion')
        .insert({
          auditoria_id: selectedAuditoria,
          titulo,
          descripcion,
          tipo_documento: tipoDocumento || null,
          solicitado_por: user?.id,
          destinatario_id: destinatarioId,
          fecha_limite: fechaLimite || null,
          estado: 'PENDIENTE',
        });

      if (error) throw error;

      setShowModal(false);
      setTitulo('');
      setDescripcion('');
      setTipoDocumento('');
      setDestinatarioId('');
      setFechaLimite('');
      setSelectedAuditoria('');
      loadSolicitudes();
      alert('✅ Solicitud creada exitosamente');
    } catch (err) {
      console.error('Error creando solicitud:', err);
      alert('Error al crear la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResponder = async () => {
    if (!linkDrive) {
      alert('Ingresa el link de Drive');
      return;
    }

    try {
      const { error } = await supabase
        .from('solicitudes_documentacion')
        .update({
          link_drive: linkDrive,
          comentarios_respuesta: comentariosRespuesta || null,
          fecha_respuesta: new Date().toISOString(),
          estado: 'ENVIADA',
        })
        .eq('id', solicitudSeleccionada?.id);

      if (error) throw error;

      setShowRespuestaModal(false);
      setLinkDrive('');
      setComentariosRespuesta('');
      setSolicitudSeleccionada(null);
      loadSolicitudes();
      alert('✅ Respuesta enviada exitosamente');
    } catch (err) {
      console.error('Error enviando respuesta:', err);
      alert('Error al enviar la respuesta');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de Documentación</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === 'auditado' 
              ? 'Documentación solicitada por los auditores' 
              : 'Gestiona las solicitudes de documentación'}
          </p>
        </div>
        {(userRole === 'auditor' || userRole === 'auditor_interno') && (
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {userRole === 'auditado' 
              ? 'No hay solicitudes de documentación pendientes' 
              : 'No has creado solicitudes de documentación'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => {
            const estado = estadoConfig[solicitud.estado];
            const EstadoIcon = estado.icon;

            return (
              <div key={solicitud.id} className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{solicitud.titulo}</h3>
                      <Badge variant={estado.variant}>
                        <EstadoIcon className="h-3 w-3 mr-1" />
                        {estado.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{solicitud.descripcion}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Auditoría:</span>
                        <p className="font-medium">
                          Actividad #{solicitud.auditoria?.activity?.activity_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha solicitud:</span>
                        <p className="font-medium">{formatDate(solicitud.fecha_solicitud)}</p>
                      </div>
                      {solicitud.fecha_limite && (
                        <div>
                          <span className="text-muted-foreground">Fecha límite:</span>
                          <p className="font-medium">{formatDate(solicitud.fecha_limite)}</p>
                        </div>
                      )}
                      {userRole === 'auditado' && (
                        <div>
                          <span className="text-muted-foreground">Solicitado por:</span>
                          <p className="font-medium">
                            {solicitud.solicitado_por_user?.full_name || solicitud.solicitado_por_user?.email}
                          </p>
                        </div>
                      )}
                      {userRole !== 'auditado' && (
                        <div>
                          <span className="text-muted-foreground">Destinatario:</span>
                          <p className="font-medium">
                            {solicitud.destinatario_user?.full_name || solicitud.destinatario_user?.email}
                          </p>
                        </div>
                      )}
                    </div>

                    {solicitud.link_drive && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <LinkIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            Link de Drive:
                          </span>
                        </div>
                        <a 
                          href={solicitud.link_drive} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-green-700 dark:text-green-300 hover:underline break-all"
                        >
                          {solicitud.link_drive}
                        </a>
                        {solicitud.comentarios_respuesta && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {solicitud.comentarios_respuesta}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {userRole === 'auditado' && solicitud.estado === 'PENDIENTE' && (
                  <Button 
                    onClick={() => {
                      setSolicitudSeleccionada(solicitud);
                      setShowRespuestaModal(true);
                    }}
                    className="gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Responder con Link de Drive
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva Solicitud */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nueva Solicitud de Documentación</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Auditoría *</label>
                <select
                  value={selectedAuditoria}
                  onChange={(e) => {
                    setSelectedAuditoria(e.target.value);
                    setDestinatarioId('');
                    if (e.target.value) {
                      loadParticipantes(e.target.value);
                    } else {
                      setParticipantes([]);
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar auditoría...</option>
                  {auditorias.map((aud) => (
                    <option key={aud.id} value={aud.id}>
                      Actividad #{aud.activity?.activity_number || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Documentación de base de datos"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descripción *</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe qué documentación necesitas..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Documento</label>
                <input
                  type="text"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  placeholder="Ej: Base de datos, Políticas, Procedimientos"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Destinatario (Auditado) *</label>
                {selectedAuditoria ? (
                  <select
                    value={destinatarioId}
                    onChange={(e) => setDestinatarioId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={participantes.length === 0}
                  >
                    <option value="">
                      {participantes.length === 0 
                        ? 'Cargando participantes...' 
                        : 'Seleccionar auditado...'}
                    </option>
                    {participantes.map((part) => {
                      const user = part.user as { id: string; full_name: string | null; email: string };
                      return (
                        <option key={part.user_id} value={part.user_id}>
                          {user?.full_name || user?.email || part.user_id}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value=""
                    disabled
                    placeholder="Primero selecciona una auditoría"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm opacity-50"
                  />
                )}
                {selectedAuditoria && participantes.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No hay auditados en esta auditoría
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Fecha Límite</label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCrearSolicitud} disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Responder */}
      {showRespuestaModal && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg border p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Responder Solicitud</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowRespuestaModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Solicitud:</p>
                <p className="text-sm">{solicitudSeleccionada.titulo}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Link de Google Drive *</label>
                <input
                  type="url"
                  value={linkDrive}
                  onChange={(e) => setLinkDrive(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Comentarios (opcional)</label>
                <textarea
                  value={comentariosRespuesta}
                  onChange={(e) => setComentariosRespuesta(e.target.value)}
                  placeholder="Agrega comentarios adicionales..."
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRespuestaModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleResponder}>
                  Enviar Respuesta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

