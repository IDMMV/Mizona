import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2, Power, PowerOff, Loader2 } from 'lucide-react';

// Usa el mismo proyecto de Supabase que ya tiene MiZona.
// Ajusta estas dos líneas a como ya las tenés configuradas en tu app
// (probablemente ya existen en un archivo supabaseClient.js — reusalo
// en vez de crear un cliente nuevo acá).
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Todas las consultas a tablas del módulo de estudiantes deben
// especificar el esquema, porque por defecto Supabase apunta a "public".
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
      setInstituciones(data);
      setError('');
    }
    setCargando(false);
  }

  function normalizarDominio(valor) {
    // Acepta que escriban "upn.edu.pe" o "@upn.edu.pe" o incluso
    // un correo completo "alguien@upn.edu.pe" — se queda solo con el dominio.
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
      setError('El dominio no parece válido. Ejemplo correcto: upn.edu.pe');
      return;
    }

    setGuardando(true);
    const { error } = await db.from('instituciones').insert({
      nombre: form.nombre.trim(),
      dominio_correo: dominio,
      tipo: form.tipo,
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
      console.error(error);
    } else {
      setInstituciones((prev) =>
        prev.map((i) => (i.id === institucion.id ? { ...i, activa: !i.activa } : i))
      );
    }
  }

  async function eliminarInstitucion(institucion) {
    const confirmado = window.confirm(
      `¿Eliminar "${institucion.nombre}"? Los estudiantes ya registrados con ese dominio no se verán afectados, pero nadie más podrá registrarse con ese correo.`
    );
    if (!confirmado) return;

    const { error } = await db.from('instituciones').delete().eq('id', institucion.id);
    if (error) {
      setError('No se pudo eliminar. Puede que ya tenga estudiantes registrados vinculados.');
      console.error(error);
    } else {
      setInstituciones((prev) => prev.filter((i) => i.id !== institucion.id));
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Instituciones — MiZona Estudiantes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Solo los correos con estos dominios pueden registrarse. Desactivar una institución
          bloquea nuevos registros sin borrar a los estudiantes ya inscritos.
        </p>
      </div>

      <form onSubmit={agregarInstitucion} className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Nombre (ej: Universidad Privada del Norte)"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Dominio (ej: upn.edu.pe)"
            value={form.dominio_correo}
            onChange={(e) => setForm({ ...form, dominio_correo: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-gray-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar institución
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="space-y-2">
        {cargando ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando instituciones...
          </div>
        ) : instituciones.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no agregaste ninguna institución.</p>
        ) : (
          instituciones.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {inst.nombre}{' '}
                  <span className="text-xs text-gray-400 font-normal">({TIPOS.find(t => t.value === inst.tipo)?.label})</span>
                </p>
                <p className="text-xs text-gray-500">@{inst.dominio_correo}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    inst.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {inst.activa ? 'Activa' : 'Desactivada'}
                </span>
                <button
                  onClick={() => alternarActiva(inst)}
                  title={inst.activa ? 'Desactivar' : 'Activar'}
                  className="p-1.5 rounded-md hover:bg-gray-100"
                >
                  {inst.activa ? <PowerOff className="w-4 h-4 text-gray-600" /> : <Power className="w-4 h-4 text-gray-600" />}
                </button>
                <button
                  onClick={() => eliminarInstitucion(inst)}
                  title="Eliminar"
                  className="p-1.5 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
