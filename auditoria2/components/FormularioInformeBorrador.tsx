'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Save, Send } from 'lucide-react';
import { SelectorObservaciones } from './SelectorObservaciones';
import type { AuditoriaInforme, AuditoriaObservacion } from '@/types/auditorias';

interface FormularioInformeBorradorProps {
  auditoriaId: string;
  informe?: AuditoriaInforme | null;
  onSuccess: () => void;
  currentUserId: string;
}

export function FormularioInformeBorrador({
  auditoriaId,
  informe,
  onSuccess,
  currentUserId,
}: FormularioInformeBorradorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState<AuditoriaObservacion[]>([]);
  const [observacionesSeleccionadas, setObservacionesSeleccionadas] = useState<string[]>([]);

  // Campos del formulario
  const [encabezado, setEncabezado] = useState('');
  const [de, setDe] = useState('');
  const [para, setPara] = useState('');
  const [asunto, setAsunto] = useState('');
  const [fechaInforme, setFechaInforme] = useState('');
  const [fechaInicioInforme, setFechaInicioInforme] = useState('');
  const [antecedentes, setAntecedentes] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [alcance, setAlcance] = useState('');
  const [resultadosRevision, setResultadosRevision] = useState('');
  const [metodologiaAplicada, setMetodologiaAplicada] = useState('');
  const [tituloObservaciones, setTituloObservaciones] = useState('');
  const [conclusiones, setConclusiones] = useState('');
  const [recomendacionesGenerales, setRecomendacionesGenerales] = useState('');

  useEffect(() => {
    loadObservaciones();
    if (informe) {
      setEncabezado(informe.encabezado || '');
      setDe(informe.de || '');
      setPara(informe.para || '');
      setAsunto(informe.asunto || '');
      // Usar fecha_inicio_informe como fecha del informe si no hay fecha específica
      setFechaInforme(informe.fecha_inicio_informe || '');
      setFechaInicioInforme(informe.fecha_inicio_informe || '');
      setAntecedentes(informe.antecedentes || '');
      setObjetivos(informe.objetivos || '');
      setAlcance(informe.alcance || '');
      setResultadosRevision(informe.resultados_revision || '');
      setMetodologiaAplicada(informe.metodologia_aplicada || '');
      setTituloObservaciones(informe.titulo_observaciones || '');
      setConclusiones(informe.conclusiones || '');
      setRecomendacionesGenerales(informe.recomendaciones_generales || '');
      
      // Cargar observaciones seleccionadas del JSONB
      if (informe.observaciones_enumeradas) {
        const obsIds = Array.isArray(informe.observaciones_enumeradas)
          ? informe.observaciones_enumeradas.map((obs: any) => obs.id || obs.observacion_id)
          : [];
        setObservacionesSeleccionadas(obsIds.filter(Boolean));
      }
    }
  }, [informe, auditoriaId]);

  const loadObservaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('auditoria_observaciones')
        .select('*')
        .eq('auditoria_id', auditoriaId)
        .order('numero_observacion', { ascending: true });

      if (error) throw error;
      setObservaciones(data || []);
    } catch (err) {
      console.error('Error cargando observaciones:', err);
    }
  };

  const handleGuardar = async () => {
    if (!encabezado.trim() || !de.trim() || !para.trim() || !asunto.trim() || !fechaInforme || !antecedentes.trim() || !objetivos.trim() || !alcance.trim()) {
      setError('Los campos Encabezado, De, Para, Asunto, Fecha del Informe, Antecedentes, Objetivos y Alcance son obligatorios');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Construir array de observaciones seleccionadas
      const observacionesEnumeradas = observaciones
        .filter(obs => observacionesSeleccionadas.includes(obs.id))
        .map(obs => ({
          id: obs.id,
          numero: obs.numero_observacion,
          titulo: obs.titulo_observacion,
          descripcion: obs.descripcion_observacion,
          recomendacion: obs.recomendacion,
          responsable_id: obs.responsable_implementacion,
        }));

      const dataToSave: any = {
        auditoria_id: auditoriaId,
        tipo_informe: 'BORRADOR',
        encabezado: encabezado.trim(),
        de: de.trim(),
        para: para.trim(),
        asunto: asunto.trim(),
        fecha_inicio_informe: fechaInforme || fechaInicioInforme || null,
        antecedentes: antecedentes.trim() || null,
        objetivos: objetivos.trim() || null,
        alcance: alcance.trim() || null,
        resultados_revision: resultadosRevision.trim() || null,
        metodologia_aplicada: metodologiaAplicada.trim() || null,
        titulo_observaciones: tituloObservaciones.trim() || null,
        observaciones_enumeradas: observacionesEnumeradas,
        conclusiones: conclusiones.trim() || null,
        recomendaciones_generales: recomendacionesGenerales.trim() || null,
        elaborado_por: currentUserId,
        estado: 'BORRADOR',
        version: informe?.version || 1,
        es_version_actual: true,
      };

      if (informe) {
        // Si hay correcciones, crear nueva versión
        if (informe.estado === 'CON_CORRECCIONES') {
          // Marcar versión anterior como no actual
          await supabase
            .from('auditoria_informe')
            .update({ es_version_actual: false })
            .eq('id', informe.id);

          // Crear nueva versión
          dataToSave.version = informe.version + 1;
          const { error: insertError } = await supabase
            .from('auditoria_informe')
            .insert(dataToSave);

          if (insertError) throw insertError;
        } else {
          // Actualizar informe existente
          const { error: updateError } = await supabase
            .from('auditoria_informe')
            .update(dataToSave)
            .eq('id', informe.id);

          if (updateError) throw updateError;
        }
      } else {
        // Crear nuevo informe
        const { error: insertError } = await supabase
          .from('auditoria_informe')
          .insert(dataToSave);

        if (insertError) throw insertError;
      }

      onSuccess();
      alert('✅ Informe borrador guardado exitosamente');
    } catch (err) {
      console.error('Error guardando informe:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al guardar el informe'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnviarRevision = async () => {
    if (!confirm('¿Estás seguro de enviar el informe a revisión? No podrás editarlo hasta que sea aprobado o se soliciten correcciones.')) {
      return;
    }

    if (!encabezado.trim() || !de.trim() || !para.trim() || !asunto.trim() || !fechaInforme || !antecedentes.trim() || !objetivos.trim() || !alcance.trim()) {
      setError('Los campos Encabezado, De, Para, Asunto, Fecha del Informe, Antecedentes, Objetivos y Alcance son obligatorios');
      return;
    }

    if (observacionesSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos una observación para el informe');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Construir array de observaciones seleccionadas
      const observacionesEnumeradas = observaciones
        .filter(obs => observacionesSeleccionadas.includes(obs.id))
        .map(obs => ({
          id: obs.id,
          numero: obs.numero_observacion,
          titulo: obs.titulo_observacion,
          descripcion: obs.descripcion_observacion,
          recomendacion: obs.recomendacion,
          responsable_id: obs.responsable_implementacion,
        }));

      const dataToSave: any = {
        auditoria_id: auditoriaId,
        tipo_informe: 'BORRADOR',
        encabezado: encabezado.trim(),
        de: de.trim(),
        para: para.trim(),
        asunto: asunto.trim(),
        fecha_inicio_informe: fechaInforme || fechaInicioInforme || null,
        antecedentes: antecedentes.trim() || null,
        objetivos: objetivos.trim() || null,
        alcance: alcance.trim() || null,
        resultados_revision: resultadosRevision.trim() || null,
        metodologia_aplicada: metodologiaAplicada.trim() || null,
        titulo_observaciones: tituloObservaciones.trim() || null,
        observaciones_enumeradas: observacionesEnumeradas,
        conclusiones: conclusiones.trim() || null,
        recomendaciones_generales: recomendacionesGenerales.trim() || null,
        elaborado_por: currentUserId,
        estado: 'EN_REVISION',
        version: informe?.version || 1,
        es_version_actual: true,
      };

      let informeId = informe?.id;

      if (informe) {
        // Si hay correcciones, crear nueva versión
        if (informe.estado === 'CON_CORRECCIONES') {
          // Marcar versión anterior como no actual
          await supabase
            .from('auditoria_informe')
            .update({ es_version_actual: false })
            .eq('id', informe.id);

          // Crear nueva versión
          dataToSave.version = informe.version + 1;
          const { data: newInforme, error: insertError } = await supabase
            .from('auditoria_informe')
            .insert(dataToSave)
            .select('id')
            .single();

          if (insertError) throw insertError;
          informeId = newInforme.id;
        } else {
          // Actualizar informe existente
          const { error: updateError } = await supabase
            .from('auditoria_informe')
            .update(dataToSave)
            .eq('id', informe.id);

          if (updateError) throw updateError;
        }
      } else {
        // Crear nuevo informe
        const { data: newInforme, error: insertError } = await supabase
          .from('auditoria_informe')
          .insert(dataToSave)
          .select('id')
          .single();

        if (insertError) throw insertError;
        informeId = newInforme.id;
      }

      // Actualizar estado de auditoría
      await supabase
        .from('auditorias')
        .update({ informe_borrador_generado: true, fecha_informe_borrador: new Date().toISOString() })
        .eq('id', auditoriaId);

      // Actualizar observaciones incluidas en el informe con numero_informe y fecha_emision_informe
      if (observacionesEnumeradas.length > 0) {
        const observacionIds = observacionesEnumeradas.map(obs => obs.id).filter(Boolean);
        const fechaActual = new Date().toISOString().split('T')[0];
        
        await supabase
          .from('auditoria_observaciones')
          .update({
            numero_informe: encabezado.trim() || null,
            fecha_emision_informe: fechaInforme || fechaInicioInforme || fechaActual,
          })
          .in('id', observacionIds);
      }

      // NOTIFICAR AL AUDITOR INTERNO que hay un informe listo para revisar
      try {
        const { data: auditorInternoData } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('role', 'auditor_interno')
          .limit(1)
          .maybeSingle();

        if (auditorInternoData) {
          const { data: auditoriaData } = await supabase
            .from('auditorias')
            .select('id, estado')
            .eq('id', auditoriaId)
            .maybeSingle();

          const { data: { session } } = await supabase.auth.getSession();
          
          // Crear comunicación en BD
          await supabase
            .from('comunicaciones_auditado')
            .insert({
              auditoria_id: auditoriaId,
              destinatario_id: auditorInternoData.id,
              tipo_comunicacion: 'NOTIFICACION',
              asunto: `Informe de Auditoría listo para revisión - ${encabezado || 'Sin encabezado'}`,
              mensaje: `El auditor ha enviado un informe borrador para tu revisión.\n\nAuditoría ID: ${auditoriaId}\nEncabezado: ${encabezado || 'Sin encabezado'}\nAsunto: ${asunto || 'Sin asunto'}\n\nPor favor, revisa el informe en la sección de Revisión.`,
              metodo_envio: 'SISTEMA',
              enviado_por: session?.user.id || null,
              confirmado: false,
            });

          // Obtener ID del informe actualizado
          const { data: informeActualizado } = await supabase
            .from('auditoria_informe')
            .select('id')
            .eq('auditoria_id', auditoriaId)
            .eq('es_version_actual', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Llamar API para notificar vía N8N
          if (informeActualizado?.id) {
            fetch('/api/notificar-auditor-interno-informe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                informe_id: informeActualizado.id,
                auditoria_id: auditoriaId,
              }),
            }).catch((error) => {
              console.error('Error llamando webhook N8N (no crítico):', error);
            });
          }
        }
      } catch (notifError) {
        console.error('Error notificando al auditor interno (no crítico):', notifError);
        // No lanzar error, solo loguear
      }

      onSuccess();
      alert('✅ Informe enviado a revisión exitosamente. El auditor interno ha sido notificado.');
    } catch (err) {
      console.error('Error enviando a revisión:', err);
      setError('Error al enviar el informe a revisión');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <h3 className="text-lg font-semibold">
          {informe ? 'Editar Informe Borrador' : 'Crear Informe Borrador'}
        </h3>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Sección 1: Encabezado */}
        <div className="space-y-4 border-b pb-6">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">Encabezado</h4>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Encabezado *</label>
            <input
              type="text"
              value={encabezado}
              onChange={(e) => setEncabezado(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: OFICIO N° 001-2025"
              required
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">De *</label>
              <input
                type="text"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ej: Auditoría Interna"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Para *</label>
              <textarea
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ej:&#10;- Mgs. ____________________ — Presidente del Consejo de Administración&#10;- Abg. ____________________ — Presidente del Consejo de Vigilancia&#10;- Mgs. ____________________ — Gerente"
                required
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lista de destinatarios (uno por línea, con nombre y cargo)
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Asunto *</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: Informe de Auditoría - Base de Datos"
              required
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha del Informe *</label>
              <input
                type="date"
                value={fechaInforme}
                onChange={(e) => setFechaInforme(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fecha de emisión del informe
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha de Inicio del Período Auditado</label>
              <input
                type="date"
                value={fechaInicioInforme}
                onChange={(e) => setFechaInicioInforme(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fecha de inicio del período que se audita (opcional)
              </p>
            </div>
          </div>
        </div>

        {/* Sección 2: Contenido */}
        <div className="space-y-4 border-b pb-6">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">Contenido</h4>

          <div>
            <label className="text-sm font-medium mb-2 block">Antecedentes *</label>
            <textarea
              value={antecedentes}
              onChange={(e) => setAntecedentes(e.target.value)}
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: La Unidad de Auditoría Interna, en cumplimiento a las actividades establecidas en el plan anual de Auditoría Interna, procedió a revisar los controles de accesos lógico a los activos de información críticos de la institución.&#10;&#10;El trabajo se llevó a cabo conforme a las Normas de Auditoría Generalmente Aceptadas..."
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Objetivos *</label>
            <textarea
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: Verificar que existan controles de acceso lógico que aseguren que el acceso a sistemas, datos y programas esté restringido a usuarios autorizados."
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Alcance *</label>
            <textarea
              value={alcance}
              onChange={(e) => setAlcance(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: El alcance incluye las operaciones relacionadas por la cooperativa con corte a julio del 2025."
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Resultados de la Revisión</label>
            <textarea
              value={resultadosRevision}
              onChange={(e) => setResultadosRevision(e.target.value)}
              className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
              placeholder="Puedes organizar los resultados en secciones numeradas:&#10;&#10;## 1. Título de la Sección&#10;&#10;### OBSERVACIÓN N° 1&#10;Descripción de la observación...&#10;&#10;### RECOMENDACIÓN N° 1&#10;Descripción de la recomendación...&#10;&#10;## 2. Otra Sección&#10;..."
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Puedes organizar los resultados en secciones numeradas. Las observaciones seleccionadas se incluirán automáticamente.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Metodología Aplicada</label>
            <textarea
              value={metodologiaAplicada}
              onChange={(e) => setMetodologiaAplicada(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe la metodología aplicada en la auditoría..."
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Sección 3: Observaciones */}
        <div className="space-y-4 border-b pb-6">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">Observaciones</h4>

          <div>
            <label className="text-sm font-medium mb-2 block">Título de las Observaciones</label>
            <input
              type="text"
              value={tituloObservaciones}
              onChange={(e) => setTituloObservaciones(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: OBSERVACIONES ENCONTRADAS"
              disabled={isSaving}
            />
          </div>

          <SelectorObservaciones
            auditoriaId={auditoriaId}
            observacionesSeleccionadas={observacionesSeleccionadas}
            onObservacionesChange={setObservacionesSeleccionadas}
          />
        </div>

        {/* Sección 4: Conclusiones y Recomendaciones */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase">Conclusiones y Recomendaciones</h4>

          <div>
            <label className="text-sm font-medium mb-2 block">Conclusiones</label>
            <textarea
              value={conclusiones}
              onChange={(e) => setConclusiones(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe las conclusiones de la auditoría..."
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Recomendaciones Generales</label>
            <textarea
              value={recomendacionesGenerales}
              onChange={(e) => setRecomendacionesGenerales(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe las recomendaciones generales..."
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleGuardar}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Borrador
          </Button>
          <Button
            type="button"
            onClick={handleEnviarRevision}
            disabled={isSaving || observacionesSeleccionadas.length === 0}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader variant="cube" size={16} />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar a Revisión
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

