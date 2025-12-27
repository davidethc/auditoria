'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { CheckCircle2, Circle, FileText } from 'lucide-react';
import type { AuditoriaInforme, InformeFirma, AuditoriaParticipante } from '@/types/auditorias';

interface FirmasInformeProps {
  informe: AuditoriaInforme;
  participantes: AuditoriaParticipante[];
  elaboradoPorUser?: { full_name: string | null; email: string };
  onSuccess: () => void;
  currentUserId: string;
  readOnly?: boolean;
}

export function FirmasInforme({
  informe,
  participantes,
  elaboradoPorUser,
  onSuccess,
  currentUserId,
  readOnly = false,
}: FirmasInformeProps) {
  const [firmas, setFirmas] = useState<InformeFirma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirmando, setIsFirmando] = useState(false);

  useEffect(() => {
    loadFirmas();
  }, [informe.id]);

  const loadFirmas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('informe_firmas')
        .select('*')
        .eq('informe_id', informe.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFirmas(data || []);
    } catch (err) {
      console.error('Error cargando firmas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirmar = async () => {
    if (!confirm('¿Estás seguro de firmar este informe?')) {
      return;
    }

    setIsFirmando(true);
    try {
      // Verificar si ya existe una firma para este usuario
      const firmaExistente = firmas.find(f => f.firmante_id === currentUserId);

      if (firmaExistente) {
        // Actualizar firma existente
        const { error: updateError } = await supabase
          .from('informe_firmas')
          .update({
            firmado: true,
            fecha_firma: new Date().toISOString(),
          })
          .eq('id', firmaExistente.id);

        if (updateError) throw updateError;
      } else {
        // Crear nueva firma
        const rolFirmante = participantes.find(p => p.user_id === currentUserId)
          ? 'AUDITADO'
          : 'AUDITOR';

        const { error: insertError } = await supabase
          .from('informe_firmas')
          .insert({
            informe_id: informe.id,
            firmante_id: currentUserId,
            rol_firmante: rolFirmante,
            firmado: true,
            fecha_firma: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Verificar si todos han firmado
      await verificarCompletitud();

      loadFirmas();
      onSuccess();
      alert('✅ Informe firmado exitosamente');
    } catch (err) {
      console.error('Error firmando:', err);
      alert('Error al firmar el informe');
    } finally {
      setIsFirmando(false);
    }
  };

  const verificarCompletitud = async () => {
    // Recargar firmas
    const { data: firmasActualizadas } = await supabase
      .from('informe_firmas')
      .select('*')
      .eq('informe_id', informe.id);

    const firmasCompletas = firmasActualizadas?.filter(f => f.firmado) || [];
    const totalFirmantes = 1 + participantes.length; // Auditor + auditados

    if (firmasCompletas.length >= totalFirmantes) {
      // Todos han firmado, cambiar estado a COMPLETADO
      await supabase
        .from('auditoria_informe')
        .update({ estado: 'COMPLETADO' })
        .eq('id', informe.id);

      // Cerrar auditoría
      await supabase
        .from('auditorias')
        .update({
          estado: 'CERRADA',
          fecha_cierre: new Date().toISOString(),
        })
        .eq('id', informe.auditoria_id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader variant="cube" size={32} />
      </div>
    );
  }

  const puedeFirmar = !readOnly && 
    informe.estado === 'ENVIADO_A_AUDITADOS' &&
    !firmas.find(f => f.firmante_id === currentUserId && f.firmado);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Firmas del Informe</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Elaborado por: {elaboradoPorUser?.full_name || elaboradoPorUser?.email || 'N/A'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Firma del Auditor */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {firmas.find(f => f.rol_firmante === 'AUDITOR' && f.firmado) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Auditor que elaboró el informe</p>
                  <p className="text-sm text-muted-foreground">
                    {elaboradoPorUser?.full_name || elaboradoPorUser?.email || 'N/A'}
                  </p>
                </div>
              </div>
              {firmas.find(f => f.rol_firmante === 'AUDITOR' && f.firmado) ? (
                <Badge variant="default">Firmado</Badge>
              ) : (
                <Badge variant="outline">Pendiente</Badge>
              )}
            </div>
            {firmas.find(f => f.rol_firmante === 'AUDITOR' && f.firmado)?.fecha_firma && (
              <p className="text-xs text-muted-foreground mt-2">
                Fecha: {new Date(firmas.find(f => f.rol_firmante === 'AUDITOR' && f.firmado)!.fecha_firma!).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>

          {/* Firmas de Auditados */}
          {participantes.map((participante) => {
            const user = participante.user as { full_name: string | null; email: string } | undefined;
            const firma = firmas.find(f => f.firmante_id === participante.user_id);
            const estaFirmado = firma?.firmado || false;
            const esMiFirma = participante.user_id === currentUserId;

            return (
              <div key={participante.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {estaFirmado ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {user?.full_name || user?.email || 'Usuario'}
                        {esMiFirma && <span className="text-xs text-muted-foreground ml-2">(Tú)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {participante.rol_en_auditoria}
                      </p>
                    </div>
                  </div>
                  {estaFirmado ? (
                    <Badge variant="default">Firmado</Badge>
                  ) : (
                    <Badge variant="outline">Pendiente</Badge>
                  )}
                </div>
                {estaFirmado && firma?.fecha_firma && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Fecha: {new Date(firma.fecha_firma).toLocaleDateString('es-ES')}
                  </p>
                )}
                {puedeFirmar && esMiFirma && !estaFirmado && (
                  <Button
                    size="sm"
                    onClick={handleFirmar}
                    disabled={isFirmando}
                    className="mt-3 gap-2"
                  >
                    {isFirmando ? (
                      <>
                        <Loader variant="cube" size={14} />
                        Firmando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Firmar Informe
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {firmas.filter(f => f.firmado).length} de {1 + participantes.length} firmas completadas
          </p>
        </div>
      </div>
    </div>
  );
}

