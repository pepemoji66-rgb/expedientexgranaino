import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import './Comentarios.css';

const Comentarios = ({ userAuth, itemKey }) => {
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [nickVisitante, setNickVisitante] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    const isAdmin = userAuth && (userAuth.email === 'archipegv2@gmail.com' || userAuth.rol === 'admin');

    const endpoint = itemKey
        ? `${API_BASE_URL}/api/comentarios/${itemKey}`
        : `${API_BASE_URL}/api/comentarios`;

    const cargarComentarios = async () => {
        try {
            const res = await axios.get(endpoint);
            setComentarios(res.data);
        } catch (err) {
            console.error("Error al cargar comentarios:", err);
        }
    };

    useEffect(() => {
        cargarComentarios();
    }, [itemKey]);

    const enviarComentario = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;

        // Si hay sesión activa, usar el nombre del usuario. Si no, usar el nick escrito o "AGENTE ANÓNIMO"
        const nombreFinal = userAuth
            ? userAuth.nombre
            : (nickVisitante.trim() || 'AGENTE ANÓNIMO');

        setEnviando(true);
        try {
            await axios.post(endpoint, {
                agente: nombreFinal,
                mensaje: nuevoComentario
            });
            setNuevoComentario('');
            setNickVisitante('');
            setEnviado(true);
            setTimeout(() => setEnviado(false), 5000);
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
            <h2 className="titulo-seccion-bunker">📡 COMUNICACIONES DEL BÚNKER</h2>

            {enviado ? (
                <div className="comentario-enviado-ok">
                    <span>✅</span>
                    <div>
                        <strong>SEÑAL RECIBIDA</strong>
                        <p>Tu mensaje ha sido enviado y está pendiente de revisión. Si todo está en orden, lo verás publicado pronto.</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={enviarComentario} className="form-comentario">
                    {!userAuth && (
                        <input
                            type="text"
                            value={nickVisitante}
                            onChange={(e) => setNickVisitante(e.target.value)}
                            placeholder="¿Cómo quieres que te llamen? (opcional)"
                            className="input-bunker-nick"
                            maxLength={40}
                        />
                    )}
                    <textarea
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        placeholder="Escribe tu comentario, teoría o avistamiento aquí..."
                        className="input-bunker-comentario"
                        required
                    ></textarea>
                    <button type="submit" disabled={enviando} className="btn-enviar-comentario">
                        {enviando ? 'TRANSMITIENDO...' : '📡 ENVIAR AL BÚNKER'}
                    </button>
                    <p className="comentario-aviso-moderacion">
                        ⚠️ Los comentarios son revisados antes de publicarse. Por favor, sé respetuoso.
                    </p>
                </form>
            )}

            <div className="lista-comentarios">
                {comentarios.length > 0 ? (
                    comentarios.map((c) => (
                        <div key={c.id} className="comentario-card fade-in">
                            <div className="comentario-header">
                                <span className="comentario-agente">👤 {c.agente?.toUpperCase()}</span>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <span className="comentario-fecha">{new Date(c.fecha).toLocaleString()}</span>
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
                    <p className="no-comentarios">FRECUENCIA LIMPIA. SÉ EL PRIMERO EN DEJAR UN MENSAJE...</p>
                )}
            </div>
        </div>
    );
};


export default Comentarios;

