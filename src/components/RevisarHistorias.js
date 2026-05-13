import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const Revisarexpedientes = () => {
  const [pendientes, setPendientes] = useState([]);

  // 1. CARGAR EXPEDIENTES PENDIENTES
  const cargarPendientes = useCallback(async () => {
    try {
      // Obtenemos todos los expedientes y filtramos los pendientes en el cliente
      const res = await axios.get(`${API_BASE_URL}/api/expedientes/expedientes`);
      const soloPendientes = res.data.filter(h => h.estado === 'pendiente' || !h.estado);
      setPendientes(soloPendientes);
    } catch (error) {
      console.error("❌ Error al pescar expedientes del búnker:", error);
    }
  }, []);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  // 2. FUNCIÓN PARA APROBAR (Mueve la historia al archivo público)
  const aprobarHistoria = async (id) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/expedientes/aprobar-expediente/${id}`);

      if (res.status === 200) {
        alert("✅ ¡Expediente aprobado! Ya es público en la web, sultán.");
        // Actualizamos la lista local eliminando el que acabamos de aprobar
        setPendientes(prev => prev.filter(h => h.id !== id));
      }
    } catch (error) {
      alert("❌ El servidor no ha respondido. ¿Está el búnker bajo ataque?");
    }
  };

  // 3. FUNCIÓN PARA ELIMINAR (Borrado permanente)
  const eliminarHistoria = async (id) => {
    if (window.confirm("¿Seguro que quieres destruir este expediente para siempre, hermano?")) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/api/expedientes/expedientes/${id}`);

        if (res.status === 200) {
          alert("🗑️ Expediente eliminado de los archivos secretos.");
          setPendientes(prev => prev.filter(h => h.id !== id));
        }
      } catch (error) {
        alert("❌ Error crítico: No se ha podido ejecutar la purga del archivo.");
      }
    }
  };

  return (
    <div className="panel-admin-container fade-in">
      <h2 className="titulo-neon" style={{
        color: '#ff00ff',
        textShadow: '0 0 15px #ff00ff',
        textAlign: 'center',
        fontFamily: 'monospace',
        marginBottom: '30px'
      }}>
        👁️ EXPEDIENTES POR REVISAR
      </h2>

      <div className="lista-pendientes">
        {pendientes.length === 0 ? (
          <div style={{
            padding: '40px',
            border: '1px dashed #ff00ff',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'var(--color-principal)',
              fontStyle: 'italic',
              fontFamily: 'Courier New'
            }}>
              SISTEMA LIMPIO: No hay expedientes nuevos esperando validación.
            </p>
          </div>
        ) : (
          pendientes.map(h => (
            <div key={h.id} className="experiencia-card" style={{
              marginBottom: '20px',
              borderLeft: '4px solid #ff00ff',
              padding: '20px',
              background: 'rgba(255, 0, 255, 0.03)',
              borderRadius: '8px',
              fontFamily: 'Courier New',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255, 0, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ color: 'var(--color-principal)', marginBottom: '10px', textTransform: 'uppercase' }}>
                  {h.titulo}
                </h3>
                <small style={{ color: '#ff00ff' }}>ID: #{h.id}</small>
              </div>

              <p style={{
                color: '#e0e0e0',
                fontSize: '0.95rem',
                margin: '15px 0',
                lineHeight: '1.6',
                background: 'rgba(0,0,0,0.2)',
                padding: '10px',
                borderRadius: '5px'
              }}>
                {h.contenido || h.descripcion}
              </p>

              <p style={{ color: '#888', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                📡 ORIGEN: <span style={{ color: '#ff00ff' }}>{h.agente || h.usuario || 'Agente Anónimo'}</span>
              </p>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button
                  className="btn-ok"
                  onClick={() => aprobarHistoria(h.id)}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    padding: '12px',
                    background: 'rgba(40, 167, 69, 0.2)',
                    border: '1px solid #28a745',
                    color: '#28a745',
                    fontWeight: 'bold',
                    transition: '0.3s'
                  }}
                >
                  ✅ VALIDAR EXPEDIENTE
                </button>

                <button
                  className="btn-del"
                  onClick={() => eliminarHistoria(h.id)}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    padding: '12px',
                    background: 'rgba(220, 53, 69, 0.2)',
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    fontWeight: 'bold',
                    transition: '0.3s'
                  }}
                >
                  🗑️ DESTRUIR ARCHIVO
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Revisarexpedientes;
