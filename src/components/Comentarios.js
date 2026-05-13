import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import './Comentarios.css';

const Comentarios = ({ userAuth }) => {
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [enviando, setEnviando] = useState(false);

    const isAdmin = userAuth && (userAuth.email === 'archipegv2@gmail.com' || userAuth.rol === 'admin');

    const cargarComentarios = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/comentarios`);
            setComentarios(res.data);
        } catch (err) {
            console.error("Error al cargar comentarios:", err);
        }
    };

    useEffect(() => {
        cargarComentarios();
    }, []);

    const enviarComentario = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;
        if (!userAuth) return alert("Debes estar registrado para comentar.");

        setEnviando(true);
        try {
            await axios.post(`${API_BASE_URL}/api/comentarios`, {
                agente: userAuth.nombre,
                mensaje: nuevoComentario
            });
            setNuevoComentario('');
            cargarComentarios();
        } catch (err) {
            alert("Error al enviar la señal.");
        } finally {
            setEnviando(false);
        }
    };

    const borrarComentario = async (id) => {
        if (!window.confirm("¿ELIMINAR ESTA COMUNICACIÓN DEL ARCHIVO?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/comentarios/${id}`);
            cargarComentarios();
        } catch (err) {
            alert("Error al borrar.");
        }
    };

    return (
        <div className="comentarios-container">
            <h2 className="titulo-seccion-bunker">📡 COMUNICACIONES DE AGENTES</h2>
            
            <form onSubmit={enviarComentario} className="form-comentario">
                <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder={userAuth ? "Escribe tu informe o comentario aquí..." : "REGÍSTRATE PARA COMENTAR EN EL BÚNKER"}
                    className="input-bunker-comentario"
                    required
                    disabled={!userAuth}
                ></textarea>
                <button type="submit" disabled={enviando || !userAuth} className="btn-enviar-comentario">
                    {enviando ? 'TRANSMITIENDO...' : 'ENVIAR AL ARCHIVO'}
                </button>
            </form>

            <div className="lista-comentarios">
                {comentarios.length > 0 ? (
                    comentarios.map((c) => (
                        <div key={c.id} className="comentario-card fade-in">
                            <div className="comentario-header">
                                <span className="comentario-agente">👤 AGENTE: {c.agente?.toUpperCase()}</span>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <span className="comentario-fecha">{new Date(c.fecha).toLocaleString()}</span>
                                    <button 
                                        className="btn-descifrar-msg" 
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            const originalText = c.mensaje;
                                            btn.innerText = '⌛';
                                            
                                            // Detectar idioma del traductor de Google (si existe)
                                            const getLang = () => {
                                                const cookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
                                                if (cookie) return cookie.split('/').pop();
                                                return 'es'; 
                                            };

                                            try {
                                                const res = await axios.post(`${API_BASE_URL}/api/traducir-tactico`, { 
                                                    texto: originalText,
                                                    idioma: getLang() 
                                                });
                                                const card = btn.closest('.comentario-card');
                                                let tradBox = card.querySelector('.traduccion-tactica');
                                                if (!tradBox) {
                                                    tradBox = document.createElement('div');
                                                    tradBox.className = 'traduccion-tactica slide-down';
                                                    card.appendChild(tradBox);
                                                }
                                                tradBox.innerHTML = `<strong>🤖 DESCIFRADO (${getLang().toUpperCase()}):</strong> ${res.data.respuesta}`;
                                                btn.innerText = '✅';
                                            } catch {
                                                btn.innerText = '❌';
                                            }

                                        }}
                                        title="Descifrar señal (Traducción IA)"
                                    >
                                        🤖
                                    </button>
                                    {isAdmin && (
                                        <button onClick={() => borrarComentario(c.id)} className="btn-borrar-comentario">
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="comentario-mensaje">{c.mensaje}</p>
                        </div>

                    ))
                ) : (
                    <p className="no-comentarios">FRECUENCIA LIMPIA. ESPERANDO INFORMES...</p>
                )}
            </div>
        </div>
    );
};


export default Comentarios;
