import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const EMOJIS = ['🛸', '👁️', '🔭', '🌌', '📡', '🧬', '⚡', '🦅', '🔍', '🗂️', '💀', '🌑'];

const ColaboradoresBunker = ({ userAuth }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [form, setForm] = useState({ nombre: '', descripcion: '', redes: '', fecha_alta: '', avatar: '🛸', destacado: false });
    const [guardando, setGuardando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);

    const isAdmin = userAuth && (userAuth.email === 'archipegv2@gmail.com' || userAuth.rol === 'admin');

    const cargar = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/colaboradores`);
            setColaboradores(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { cargar(); }, []);

    const guardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await axios.post(`${API_BASE_URL}/api/colaboradores`, form);
            setForm({ nombre: '', descripcion: '', redes: '', fecha_alta: '', avatar: '🛸', destacado: false });
            setMostrarForm(false);
            cargar();
        } catch (err) { alert('Error al guardar'); }
        finally { setGuardando(false); }
    };

    const eliminar = async (id) => {
        if (!window.confirm('¿Eliminar colaborador?')) return;
        await axios.delete(`${API_BASE_URL}/api/colaboradores/${id}`);
        cargar();
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', fontFamily: 'Inter, monospace' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <p style={{ color: 'var(--color-principal)', fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>RED DE INVESTIGADORES</p>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 20px' }}>
                    Colaboradores del Búnker
                </h1>
                <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.8 }}>
                    Personas que han contribuido a enriquecer los archivos del Expediente X Granaíno con investigaciones, testimonios, documentación o difusión.
                </p>
                <div style={{ width: '60px', height: '2px', background: 'var(--color-principal)', margin: '30px auto 0' }}></div>
            </div>

            {isAdmin && (
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <button
                        onClick={() => setMostrarForm(!mostrarForm)}
                        style={{ background: 'var(--color-principal)', color: '#000', border: 'none', padding: '12px 30px', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                        {mostrarForm ? '✕ CANCELAR' : '+ AÑADIR COLABORADOR'}
                    </button>

                    {mostrarForm && (
                        <form onSubmit={guardar} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #222', borderRadius: '4px', padding: '30px', marginTop: '20px', textAlign: 'left', display: 'grid', gap: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>NOMBRE / NICK *</label>
                                    <input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} required placeholder="Agente Sombra, María G..." style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>FECHA DE ALTA</label>
                                    <input type="date" value={form.fecha_alta} onChange={e => setForm(p => ({...p, fecha_alta: e.target.value}))} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>DESCRIPCIÓN / MÉRITOS</label>
                                <textarea value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} placeholder="Investigador de avistamientos en la comarca de la Vega..." rows={3} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', fontFamily: 'monospace', resize: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>REDES / CONTACTO</label>
                                    <input value={form.redes} onChange={e => setForm(p => ({...p, redes: e.target.value}))} placeholder="@usuario_facebook, email..." style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>ICONO</label>
                                    <select value={form.avatar} onChange={e => setForm(p => ({...p, avatar: e.target.value}))} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', color: '#fff', padding: '10px', fontFamily: 'monospace' }}>
                                        {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                                    </select>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <input type="checkbox" checked={form.destacado} onChange={e => setForm(p => ({...p, destacado: e.target.checked}))} />
                                    ⭐ DESTACADO
                                </label>
                            </div>
                            <button type="submit" disabled={guardando} style={{ background: '#fff', color: '#000', border: 'none', padding: '14px', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase' }}>
                                {guardando ? 'GUARDANDO...' : '✅ GUARDAR COLABORADOR'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {colaboradores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#444' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '20px' }}>📡</p>
                    <p style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Sin colaboradores registrados aún</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {colaboradores.map(c => (
                        <div key={c.id} style={{
                            background: c.destacado ? 'rgba(var(--rgb-principal), 0.05)' : 'rgba(0,0,0,0.4)',
                            border: c.destacado ? '1px solid var(--color-principal)' : '1px solid #1a1a1a',
                            borderRadius: '4px', padding: '25px', position: 'relative',
                            boxShadow: c.destacado ? '0 0 20px rgba(var(--rgb-principal), 0.1)' : 'none'
                        }}>
                            {c.destacado && <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.7rem', color: 'var(--color-principal)', letterSpacing: '1px' }}>⭐ DESTACADO</span>}
                            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{c.avatar || '🛸'}</div>
                            <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>{c.nombre}</h3>
                            {c.descripcion && <p style={{ color: '#8892b0', fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 15px' }}>{c.descripcion}</p>}
                            {c.redes && <p style={{ color: '#555', fontSize: '0.72rem', margin: '0 0 10px', letterSpacing: '0.5px' }}>🔗 {c.redes}</p>}
                            {c.fecha_alta && <p style={{ color: '#333', fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', margin: '0' }}>Alta: {new Date(c.fecha_alta).toLocaleDateString('es-ES')}</p>}
                            {isAdmin && (
                                <button onClick={() => eliminar(c.id)} style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'transparent', border: '1px solid #333', color: '#ff4444', padding: '4px 8px', fontSize: '0.65rem', cursor: 'pointer' }}>🗑️</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColaboradoresBunker;
