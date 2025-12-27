'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, X } from 'lucide-react';
import type { AuditoriaObservacion } from '@/types/auditorias';

interface FormularioObservacionProps {
  auditoriaId: string;
  observacion?: AuditoriaObservacion | null;
  onSuccess: () => void;
  onCancel: () => void;
  currentUserId: string;
}

export function FormularioObservacion({
  auditoriaId,
  observacion,
  onSuccess,
  onCancel,
  currentUserId,
}: FormularioObservacionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Campos del formulario
  const [numeroObservacion, setNumeroObservacion] = useState<number>(1);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [estrategia, setEstrategia] = useState('');
  const [entregable, setEntregable] = useState('');
  const [probabilidad, setProbabilidad] = useState('');
  const [impacto, setImpacto] = useState('');
  const [riesgo, setRiesgo] = useState('');
  const [responsableEstrategia, setResponsableEstrategia] = useState('');
  const [responsableImplementacion, setResponsableImplementacion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [plazoDias, setPlazoDias] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
    if (observacion) {
      setNumeroObservacion(observacion.numero_observacion);
      setTitulo(observacion.titulo_observacion);
      setDescripcion(observacion.descripcion_observacion);
      setRecomendacion(observacion.recomendacion);
      setEstrategia(observacion.estrategia || '');
      setEntregable(observacion.entregable || '');
      setProbabilidad(observacion.probabilidad || '');
      setImpacto(observacion.impacto || '');
      setRiesgo(observacion.riesgo || '');
      setResponsableEstrategia(observacion.responsable_estrategia || '');
      setResponsableImplementacion(observacion.responsable_implementacion || '');
      setFechaInicio(observacion.fecha_inicio || '');
      setFechaFin(observacion.fecha_fin || '');
      setPlazoDias(observacion.plazo_dias_laborables || null);
    } else {
      // Obtener siguiente número de observación
      loadSiguienteNumero();
    }
  }, [observacion, auditoriaId]);

  const loadSiguienteNumero = async () => {
    try {
      const { data } = await supabase
        .from('auditoria_observaciones')
        .select('numero_observacion')
        .eq('auditoria_id', auditoriaId)
        .order('numero_observacion', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setNumeroObservacion(data[0].numero_observacion + 1);
      } else {
        setNumeroObservacion(1);
      }
    } catch (err) {
      console.error('Error cargando siguiente número:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('role', ['auditado', 'auditor', 'auditor_interno'])
        .order('full_name', { ascending: true });

      setUsers(data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim() || !descripcion.trim() || !recomendacion.trim()) {
      setError('Los campos Título, Descripción y Recomendación son obligatorios');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const dataToSave: any = {
        auditoria_id: auditoriaId,
        numero_observacion: numeroObservacion,
        titulo_observacion: titulo.trim(),
        descripcion_observacion: descripcion.trim(),
        recomendacion: recomendacion.trim(),
        estrategia: estrategia.trim() || null,
        entregable: entregable.trim() || null,
        probabilidad: probabilidad || null,
        impacto: impacto || null,
        riesgo: riesgo || null,
        auditor_id: currentUserId,
        responsable_estrategia: responsableEstrategia || null,
        responsable_implementacion: responsableImplementacion || null,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        plazo_dias_laborables: plazoDias || null,
        estado_observacion: 'NO_INICIADA',
      };

      if (observacion) {
        const { error: updateError } = await supabase
          .from('auditoria_observaciones')
          .update(dataToSave)
          .eq('id', observacion.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('auditoria_observaciones')
          .insert(dataToSave);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error guardando observación:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al guardar la observación'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {observacion ? 'Editar Observación' : 'Nueva Observación'}
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Número de Observación
            </label>
            <input
              type="number"
              value={numeroObservacion}
              onChange={(e) => setNumeroObservacion(parseInt(e.target.value) || 1)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Título de la Observación *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ej: Falta de controles en base de datos"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Descripción de la Observación *
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe detalladamente la observación encontrada..."
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Recomendación *
          </label>
          <textarea
            value={recomendacion}
            onChange={(e) => setRecomendacion(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Describe la recomendación para corregir la observación..."
            required
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Probabilidad</label>
            <select
              value={probabilidad}
              onChange={(e) => setProbabilidad(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            >
              <option value="">Seleccionar...</option>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Impacto</label>
            <select
              value={impacto}
              onChange={(e) => setImpacto(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            >
              <option value="">Seleccionar...</option>
              <option value="BAJO">Bajo</option>
              <option value="MEDIO">Medio</option>
              <option value="ALTO">Alto</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Riesgo</label>
            <select
              value={riesgo}
              onChange={(e) => setRiesgo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            >
              <option value="">Seleccionar...</option>
              <option value="BAJO">Bajo</option>
              <option value="MEDIO">Medio</option>
              <option value="ALTO">Alto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Estrategia</label>
          <textarea
            value={estrategia}
            onChange={(e) => setEstrategia(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Estrategia para implementar la recomendación..."
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Entregable</label>
          <input
            type="text"
            value={entregable}
            onChange={(e) => setEntregable(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Entregable esperado..."
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Responsable de Estrategia</label>
            <select
              value={responsableEstrategia}
              onChange={(e) => setResponsableEstrategia(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            >
              <option value="">Seleccionar...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Responsable de Implementación</label>
            <select
              value={responsableImplementacion}
              onChange={(e) => setResponsableImplementacion(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            >
              <option value="">Seleccionar...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha de Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fecha de Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Plazo (días hábiles)</label>
            <input
              type="number"
              value={plazoDias || ''}
              onChange={(e) => setPlazoDias(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              min="1"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader variant="cube" size={16} />
                Guardando...
              </>
            ) : (
              observacion ? 'Actualizar Observación' : 'Crear Observación'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

