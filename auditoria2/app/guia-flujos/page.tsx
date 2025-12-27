'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
// Using div with card styling instead
import { 
  FileText, 
  PlayCircle, 
  FileCheck, 
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

type FlujoConEstado = {
  titulo: string;
  descripcion: string;
  ruta: string;
  estado?: string;
  icon: React.ComponentType<{ className?: string }>;
  pasos: string[];
};

export default function GuiaFlujosPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        setUserRole(data.role);
      }
    };
    loadRole();
  }, []);

  const flujosAuditor = [
    {
      titulo: '1. Preparación',
      descripcion: 'Completa objetivos, alcance y criterios de la auditoría',
      ruta: '/auditorias',
      estado: 'PLANIFICADA',
      icon: ClipboardList,
      pasos: [
        'Ve a "Mis Auditorías" en el sidebar',
        'Selecciona una auditoría en estado PLANIFICADA',
        'En el tab "Preparación", completa el formulario',
        'Guarda la preparación',
        'Agrega participantes en el tab "Participantes"',
        'Haz clic en "Notificar Auditados" cuando todo esté listo'
      ]
    },
    {
      titulo: '2. Ejecución',
      descripcion: 'Registra observaciones durante la ejecución de la auditoría',
      ruta: '/auditorias',
      estado: 'EN_EJECUCION',
      icon: PlayCircle,
      pasos: [
        'Ve a "Mis Auditorías"',
        'Selecciona una auditoría en estado EN_EJECUCION',
        'Haz clic en el tab "Ejecución"',
        'Registra observaciones usando el botón "Nueva Observación"',
        'Completa todos los campos de cada observación',
        'Cuando termines, haz clic en "Finalizar Ejecución"'
      ]
    },
    {
      titulo: '3. Crear Informe Borrador',
      descripcion: 'Crea el informe borrador con todas las observaciones',
      ruta: '/auditorias',
      estado: 'EN_REPORTE',
      icon: FileText,
      pasos: [
        'Ve a "Mis Auditorías"',
        'Selecciona una auditoría en estado EN_REPORTE',
        'Haz clic en el tab "Informe"',
        'Completa el formulario del informe borrador',
        'Selecciona las observaciones a incluir',
        'Haz clic en "Enviar a Revisión"'
      ]
    },
    {
      titulo: '4. Socialización',
      descripcion: 'Registra la reunión de socialización del informe',
      ruta: '/auditorias',
      estado: 'APROBADO',
      icon: MessageSquare,
      pasos: [
        'Ve a "Mis Auditorías"',
        'Selecciona una auditoría con informe APROBADO',
        'En el tab "Informe" → "Socialización"',
        'Registra la fecha y participantes de la reunión',
        'Haz clic en "Registrar Socialización"'
      ]
    },
    {
      titulo: '5. Enviar Informe Final',
      descripcion: 'Ajusta el informe final y envíalo a los auditados',
      ruta: '/auditorias',
      estado: 'SOCIALIZADO',
      icon: FileText,
      pasos: [
        'Revisa los descargos presentados por los auditados',
        'Ajusta el informe final según sea necesario',
        'Envía el informe final a los auditados',
        'Monitorea que todos completen la estrategia y firmen'
      ]
    }
  ];

  const flujosAuditado = [
    {
      titulo: '1. Ver Preparación',
      descripcion: 'Revisa la información de la auditoría',
      ruta: '/auditorias',
      icon: FileText,
      pasos: [
        'Ve a "Mis Auditorías" en el sidebar',
        'Selecciona la auditoría asignada',
        'Revisa la preparación en el tab "Preparación"',
        'Confirma tu participación si es necesario'
      ]
    },
    {
      titulo: '2. Presentar Descargos',
      descripcion: 'Presenta descargos si consideras que alguna observación no aplica',
      ruta: '/auditorias',
      estado: 'SOCIALIZADO',
      icon: MessageSquare,
      pasos: [
        'Ve a "Mis Auditorías"',
        'Selecciona la auditoría con informe SOCIALIZADO',
        'En el tab "Informe" → "Descargos"',
        'Haz clic en "Presentar Descargo" en la observación correspondiente',
        'Completa la descripción y agrega link de Drive con evidencias',
        'Envía el descargo'
      ]
    },
    {
      titulo: '3. Completar Estrategia',
      descripcion: 'Define la estrategia de implementación para las observaciones',
      ruta: '/auditorias',
      estado: 'ENVIADO_A_AUDITADOS',
      icon: CheckCircle2,
      pasos: [
        'Ve a "Mis Auditorías"',
        'Selecciona la auditoría con informe ENVIADO_A_AUDITADOS',
        'En el tab "Informe" → "Final"',
        'Completa: Estrategia, Fechas de inicio/fin, Entregable',
        'Haz clic en "Guardar Estrategia"',
        'Firma el informe'
      ]
    }
  ];

  const flujosAuditorInterno = [
    {
      titulo: 'Revisar Informes',
      descripcion: 'Revisa y aprueba los informes borradores',
      ruta: '/auditorias/revision',
      icon: FileCheck,
      pasos: [
        'Ve a "Revisión de Informes" en el sidebar',
        'Selecciona un informe pendiente de revisión',
        'Revisa el contenido completo del informe',
        'Agrega comentarios si es necesario',
        'Haz clic en "Aprobar Informe" o "Solicitar Correcciones"'
      ]
    }
  ];

  const flujos = userRole === 'auditor' 
    ? flujosAuditor 
    : userRole === 'auditado' 
    ? flujosAuditado 
    : userRole === 'auditor_interno'
    ? [...flujosAuditorInterno, ...flujosAuditor]
    : [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Guía de Flujos del Sistema</h1>
        <p className="text-muted-foreground">
          Rol actual: <span className="font-medium">{userRole || 'No definido'}</span>
        </p>
      </div>

      <div className="grid gap-6">
        {flujos.map((flujo, idx) => {
          const Icon = flujo.icon;
          return (
            <div key={idx} className="rounded-lg border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{flujo.titulo}</h3>
                  <p className="text-muted-foreground mb-4">{flujo.descripcion}</p>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Pasos a seguir:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {flujo.pasos.map((paso, pIdx) => (
                        <li key={pIdx}>{paso}</li>
                      ))}
                    </ol>
                  </div>

          {('estado' in flujo) && (flujo as FlujoConEstado).estado && (
            <div className="mb-4">
              <span className="text-xs bg-muted px-2 py-1 rounded">
                Estado requerido: {(flujo as FlujoConEstado).estado}
              </span>
            </div>
          )}

                  <Button
                    variant="outline"
                    onClick={() => router.push(flujo.ruta)}
                    className="gap-2"
                  >
                    Ir a {flujo.ruta === '/auditorias' ? 'Mis Auditorías' : 'Revisión de Informes'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-muted/50 p-6">
        <h3 className="font-semibold mb-2">📋 Resumen de Navegación</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Sidebar principal:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Mis Auditorías</strong> → Acceso principal a todas las auditorías</li>
            <li><strong>Documents</strong> → Solicitudes de documentación</li>
            {userRole === 'auditor_interno' && (
              <li><strong>Revisión de Informes</strong> → Revisar y aprobar informes borradores</li>
            )}
          </ul>
          <p className="mt-4"><strong>Desde &quot;Mis Auditorías&quot;:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Selecciona una auditoría para ver sus detalles</li>
            <li>Los <strong>tabs</strong> cambian según el estado de la auditoría</li>
            <li><strong>Ejecución</strong> aparece cuando el estado es EN_EJECUCION</li>
            <li><strong>Informe</strong> aparece cuando el estado es EN_REPORTE o CERRADA</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

