import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import './gestionUsuarios.css';

const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]); // Siempre inicializado como array
    const [cargando, setCargando] = useState(true);
    const [editRank, setEditRank] = useState({});
    const ranges = ['Agente en Prácticas', 'Cabo', 'Cabo 1º', 'Sargento', 'Teniente', 'Capitán', 'Comandante'];
    const navigate = useNavigate();

    // Cargar la lista de usuarios desde el búnker central
    const obtenerUsuarios = async () => {
        try {
            setCargando(true);
            // Sincronizado con la ruta del servidor
            const res = await axios.get(`${API_BASE_URL}/api/usuarios`);

            // BLINDAJE: Solo aceptamos la lista si es un array
            if (res.data && Array.isArray(res.data)) {
                setUsuarios(res.data);
            } else {
                setUsuarios([]);
            }
        } catch (err) {
            console.error("❌ ERROR AL ESCANEAR AGENTES:", err);
            setUsuarios([]); // Red de seguridad
        } finally {
            setCargando(false);
        }
    };

    const actualizarRango = async (id, rango) => {
        try {
            await axios.put(`${API_BASE_URL}/api/usuarios/${id}/rango`, { rango });
            setEditRank(prev => ({ ...prev, [id]: rango }));
            obtenerUsuarios();
        } catch (err) {
            console.error("Error actualizando rango:", err);
            alert("❌ No se pudo actualizar el rango. Inténtalo de nuevo.");
        }
    };

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    // Función para eliminar un agente definitivamente
    const eliminarUsuario = async (id) => {
        if (window.confirm("⚠️ ¿ESTÁ SEGURO DE ELIMINAR A ESTE AGENTE DEL SISTEMA DEFINITIVAMENTE?")) {
            try {
                // Ruta corregida para la eliminación centralizada
                await axios.delete(`${API_BASE_URL}/api/usuarios/${id}`);
                alert("🗑️ REGISTRO BORRADO CON ÉXITO.");
                obtenerUsuarios(); // Recargamos la lista
            } catch (err) {
                console.error("Error al eliminar:", err);
                alert("❌ ERROR: El sistema no permite borrar este registro ahora mismo.");
            }
        }
    };

    return (
        <div className="gestion-usuarios-container fade-in">
            <div className="header-acciones-gestion">
                <button
                    onClick={() => navigate('/')}
                    className="btn-volver-bunker"
                >
                    🏠 VOLVER A INICIO (WEB)
                </button>
            </div>

            <h2 className="neon-text-green">PANEL DE CONTROL DE USUARIOS</h2>

            <div className="tabla-responsive">
                {cargando ? (
                    <div className="radar-loader-container">
                        <div className="radar-loader"></div>
                        <p>ESCANEANDO IDENTIDADES EN EL BÚNKER...</p>
                    </div>
                ) : (
                    <table className="tabla-usuarios-bunker">
                        <thead>
                            <tr className="cabecera-tabla">
                                <th>ID</th>
                                <th>NOMBRE</th>
                                <th>EMAIL</th>
                                <th>CIUDAD</th>
                                <th>EDAD</th>
                                <th>VISITAS</th>
                                <th>RANGO</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(usuarios) && usuarios.length > 0 ? (
                                usuarios.map((u) => (
                                    <tr key={u.id} className="fila-agente">
                                        <td className="txt-id">#{u.id}</td>
                                        <td className="txt-nombre">{u.nombre}</td>
                                        <td className="txt-email">{u.email}</td>
                                        <td className="txt-ciudad">{u.ciudad || 'N/A'}</td>
                                        <td className="txt-edad">{u.edad || '--'}</td>
                                        <td className="txt-visitas">{u.visitas || '0'}</td>
                                        <td className="txt-rango">
                                            <select
                                                value={editRank[u.id] ?? (u.rango || 'Agente en Prácticas')}
                                                onChange={(e) => actualizarRango(u.id, e.target.value)}
                                                className="select-rango-bunker"
                                            >
                                                {ranges.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="txt-acciones">
                                            <button
                                                onClick={() => eliminarUsuario(u.id)}
                                                className="btn-eliminar-agente-rojo"
                                            >
                                                ELIMINAR
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="sin-datos-tabla">
                                        📡 NO SE HAN DETECTADO AGENTES EN LA FRECUENCIA.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default GestionUsuarios;