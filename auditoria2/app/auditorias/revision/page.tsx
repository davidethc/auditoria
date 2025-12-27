'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Eye, FileText } from 'lucide-react';
import type { AuditoriaInforme } from '@/types/auditorias';
import { formatearFecha } from '@/utils/auditoriaHelpers';

export default function RevisionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [informes, setInformes] = useState<AuditoriaInforme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'aprobados' | 'correcciones'>('pendientes');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadUserRole();
    }
  }, [authLoading, user]);

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
        if (data.role === 'auditor_interno') {
          loadInformes();
        } else {
          setError('No tienes permisos para acceder a esta página. Solo el Auditor Interno puede revisar informes.');
          setIsLoading(false);
        }
      } else {
        setError('No se pudo verificar tu rol');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error cargando rol:', err);
      setError('Error al verificar permisos');
      setIsLoading(false);
    }
  };

  const loadInformes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('auditoria_informe')
        .select('*')
        .eq('es_version_actual', true)
        .order('fecha_elaboracion', { ascending: false });

      // Filtrar según el filtro seleccionado
      if (filtro === 'pendientes') {
        query = query.eq('estado', 'EN_REVISION');
      } else if (filtro === 'aprobados') {
        query = query.eq('estado', 'APROBADO');
      } else if (filtro === 'correcciones') {
        query = query.eq('estado', 'CON_CORRECCIONES');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setInformes(data || []);
    } catch (err) {
      console.error('Error cargando informes:', err);
      setError('Error al cargar los informes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && userRole === 'auditor_interno') {
      loadInformes();
    }
  }, [filtro, userRole]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader variant="cube" size={48}>
          <span className="text-sm text-muted-foreground mt-4">Cargando...</span>
        </Loader>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    BORRADOR: { label: 'Borrador', variant: 'outline' },
    EN_REVISION: { label: 'En Revisión', variant: 'secondary' },
    APROBADO: { label: 'Aprobado', variant: 'default' },
    CON_CORRECCIONES: { label: 'Con Correcciones', variant: 'destructive' },
    SOCIALIZADO: { label: 'Socializado', variant: 'default' },
    ENVIADO_A_AUDITADOS: { label: 'Enviado a Auditados', variant: 'default' },
    COMPLETADO: { label: 'Completado', variant: 'default' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revisión de Informes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y aprueba los informes borradores de auditoría
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filtro === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('todos')}
        >
          Todos
        </Button>
        <Button
          variant={filtro === 'pendientes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('pendientes')}
        >
          Pendientes
        </Button>
        <Button
          variant={filtro === 'aprobados' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('aprobados')}
        >
          Aprobados
        </Button>
        <Button
          variant={filtro === 'correcciones' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('correcciones')}
        >
          Con Correcciones
        </Button>
      </div>

      {/* Lista de informes */}
      {informes.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No hay informes {filtro !== 'todos' ? filtro : ''} para revisar
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {informes.map((informe) => {
            const estado = estadoConfig[informe.estado] || estadoConfig.BORRADOR;

            return (
              <div key={informe.id} className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Informe de Auditoría</h3>
                    <p className="text-sm text-muted-foreground">
                      Versión {informe.version}
                    </p>
                  </div>
                  <Badge variant={estado.variant}>
                    {estado.label}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Asunto:</span>{' '}
                    <span className="text-muted-foreground">
                      {informe.asunto || 'Sin asunto'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Elaborado:</span>{' '}
                    <span className="text-muted-foreground">
                      {formatearFecha(informe.fecha_elaboracion)}
                    </span>
                  </div>
                  {informe.fecha_revision && (
                    <div>
                      <span className="font-medium">Revisado:</span>{' '}
                      <span className="text-muted-foreground">
                        {formatearFecha(informe.fecha_revision)}
                      </span>
                    </div>
                  )}
                  {informe.comentarios_revision && (
                    <div>
                      <span className="font-medium">Comentarios:</span>{' '}
                      <span className="text-muted-foreground line-clamp-2">
                        {informe.comentarios_revision}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => router.push(`/auditorias/${informe.auditoria_id}/informe`)}
                >
                  <Eye className="h-4 w-4" />
                  {informe.estado === 'EN_REVISION' ? 'Revisar' : 'Ver Detalles'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

