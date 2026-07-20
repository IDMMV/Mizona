import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Power, PowerOff, Trash2 } from 'lucide-react';

const db = supabase.schema('estudiantes');

const TIPOS = [
  { value: 'universidad', label: 'Universidad' },
  { value: 'instituto', label: 'Instituto' },
  { value: 'colegio', label: 'Colegio' },
];

export default function AdminInstituciones() {
  const [instituciones, setInstituciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', dominio_correo: '', tipo: 'universidad' });

  useEffect(() => {
    cargarInstituciones();
  }, []);

  async function cargarInstituciones() {
    setCargando(true);
    const { data, error } = await db
      .from('instituciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('No se pudo cargar la lista de instituciones.');
      console.error(error);
    } else {
      setInstituciones(data || []);
      setError('');
    }
    setCargando(false);
  }

  function normalizarDominio(valor) {
    let d = valor.trim().toLowerCase();
    if (d.includes('@')) d = d.split('@').pop();
    return d.replace(/^@/, '');
  }

  async function agregarInstitucion(e) {
    e.preventDefault();
    setError('');
    const dominio = normalizarDominio(form.dominio_correo);

    if (!form.nombre.trim()) {
      setError('Falta el nombre de la institución.');
      return;
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) {
      setError('El dominio no parece válido. Ejemplo: upn.edu.pe');
      return;
    }

    setGuardando(true);
    const { error } = await db.from('instituciones').insert({
      nombre: form.nombre.trim(),
      dominio_correo: dominio,
      tipo: form.tipo,
      activa: true,
    });

    if (error) {
      if (error.code === '23505') {
        setError('Ese dominio ya está registrado.');
      } else {
        setError('No se pudo guardar. Intenta de nuevo.');
        console.error(error);
      }
    } else {
      setForm({ nombre: '', dominio_correo: '', tipo: 'universidad' });
      await cargarInstituciones();
    }
    setGuardando(false);
  }

  async function alternarActiva(institucion) {
    const { error } = await db
      .from('instituciones')
      .update({ activa: !institucion.activa })
      .eq('id', institucion.id);

    if (error) {
      setError('No se pudo actualizar el estado.');
    } else {
      setInstituciones(prev =>
        prev.map(i => i.id === institucion.id ? { ...i, activa: !i.activa } : i)
      );
    }
  }

  async function eliminarInstitucion(institucion) {
    if (!window.confirm(`¿Eliminar "${institucion.nombre}"?`)) return;

    const { error } = await db.from('instituciones').delete().eq('id', institucion.id);
    if (error) {
      setError('No se pudo eliminar.');
    } else {
      setInstituciones(prev => prev.filter(i => i.id !== institucion.id));
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Instituciones — MiZona Estudiantes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona los dominios permitidos para registro de estudiantes.
        </p>
      </div>

      <form onSubmit={agregarInstitucion} className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Dominio (ej: upn.edu.pe)"
            value={form.dominio_correo}
            onChange={(e) => setForm({ ...form, dominio_correo: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {TIPOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      <div className="space-y-2">
        {cargando ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : instituciones.length === 0 ? (
          <p className="text-gray-500">No hay instituciones registradas aún.</p>
        ) : (
          instituciones.map(inst => (
            <div key={inst.id} className="flex justify-between items-center border rounded-lg p-4
