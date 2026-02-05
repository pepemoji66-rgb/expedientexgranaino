import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './chat.css';

const socket = io('http://localhost:5000');

const Chat = ({ usuarioActivo }) => {
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([]);
    const scrollRef = useRef();

    // Comprobamos si eres el gran jefe
    const esAdmin = usuarioActivo?.email === 'expedientexpepe@moreno.com' || usuarioActivo?.rol === 'admin';

    useEffect(() => {
        fetch('http://localhost:5000/chat-historial')
            .then(res => res.json())
            .then(data => setHistorial(data))
            .catch(err => console.error("Error cargando chat:", err));

        socket.on('recibir_mensaje', (nuevoMsg) => {
            setHistorial((prev) => [...prev, nuevoMsg]);
        });

        // Escuchar evento de limpieza global
        socket.on('chat_limpiado', () => {
            setHistorial([]);
        });

        return () => {
            socket.off('recibir_mensaje');
            socket.off('chat_limpiado');
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [historial]);

    const manejarEnvio = (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return;

        const dataPayload = {
            nombre_usuario: usuarioActivo?.nombre || 'Invitado',
            mensaje: mensaje,
            rol_usuario: esAdmin ? 'admin' : 'usuario',
            tipo: 'publico',
            fecha: new Date()
        };

        socket.emit('enviar_mensaje', dataPayload);
        setMensaje('');
    };

    // FUNCIÓN SOLO PARA ADMIN: Limpiar toda la tabla
    const limpiarChatTotal = () => {
        if (window.confirm("¿BORRAR TODO EL HISTORIAL DE LA FRECUENCIA?")) {
            socket.emit('limpiar_chat_servidor');
        }
    };

    return (
        <div className="chat-container-root">
            <div className="chat-header-tactico">
                <div className="header-info">
                    <div className="dot-online"></div>
                    <span>FRECUENCIA: {esAdmin ? 'COMANDANCIA' : 'USUARIOS'}</span>
                </div>
                
                {/* SOLO EL ADMIN VE ESTE BOTÓN */}
                {esAdmin && (
                    <button onClick={limpiarChatTotal} className="btn-reset-chat">
                        🗑️ REINICIAR CANAL
                    </button>
                )}
            </div>

            <div className="chat-messages-area" ref={scrollRef}>
                {historial.map((m, idx) => (
                    <div key={idx} className={`chat-line ${m.rol_usuario === 'admin' ? 'line-admin' : ''}`}>
                        <span className="chat-user">
                            {m.rol_usuario === 'admin' ? '⭐ [ADMIN] ' : ''}[{m.nombre_usuario}]:
                        </span>
                        <span className="chat-text">{m.mensaje}</span>
                        <span className="chat-time">
                            {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
            </div>

            <form className="chat-input-form" onSubmit={manejarEnvio}>
                <input 
                    type="text" 
                    placeholder={esAdmin ? "Escribir orden..." : "Escribir mensaje..."}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                />
                <button type="submit">{esAdmin ? 'EMITIR' : 'TRANSMITIR'}</button>
            </form>
        </div>
    );
};

export default Chat;