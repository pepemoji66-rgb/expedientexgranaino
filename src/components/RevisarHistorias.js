import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const RevisarHistorias = () => {
  const [pendientes, setPendientes] = useState([]);

  // 1. CARGAR HISTORIAS (Memorizamos la función para evitar Warnings)
  const cargarPendientes = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/historias-pendientes');
      setPendientes(res.data);
    } catch (error) {
      console.error("Error al pescar historias:", error);
    }
  }, []);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  // 2. FUNCIÓN PARA APROBAR
  const aprobarHistoria = async (id) => {
    try {
      const res = await axios.post(`http://localhost:5000/aprobar-historia/${id}`);

      if (res.status === 200) {
        alert("¡Expediente aprobado! Ya es público en la web, sultán.");
        setPendientes(prev => prev.filter(h => h.id !== id));
      }
    } catch (error) {
      alert("El servidor no ha respondido correctamente a la orden.");
    }
  };

  // 3. FUNCIÓN PARA ELIMINAR
  const eliminarHistoria = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este expediente para siempre, hermano?")) {
      try {
        const res = await axios.delete(`http://localhost:5000/eliminar-historia/${id}`);

        if (res.status === 200) {
          alert("Expediente eliminado de los archivos.");
          setPendientes(prev => prev.filter(h => h.id !== id));
        }
      } catch (error) {
        alert("Error al intentar conectar para eliminar.");
      }
    }
  };

  return (
    <div className="panel-admin-container fade-in">
      <h2 className="titulo-neon" style={{ color: '#ff00ff', textShadow: '0 0 10px #ff00ff' }}>
        👁️ EXPEDIENTES POR REVISAR
      </h2>

      <div style={{ marginTop: '30px' }}>
        {pendientes.length === 0 ? (
          <p style={{ color: 'var(--color-principal)', textAlign: 'center' }}>
            No hay expedientes nuevos, el búnker está limpio.
          </p>
        ) : (
          pendientes.map(h => (
            <div key={h.id} className="experiencia-card" style={{
              marginBottom: '20px',
              borderLeft: '4px solid #ff00ff',
              padding: '15px',
              background: 'rgba(255, 0, 255, 0.05)',
              borderRadius: '8px',
              fontFamily: 'Courier New'
            }}>
              <h3 style={{ color: 'var(--color-principal)' }}>{h.titulo}</h3>
              <p style={{ color: '#fff', fontSize: '0.9rem', margin: '10px 0' }}>{h.contenido}</p>
              <p style={{ color: '#888', fontSize: '0.8rem' }}>Enviado por: {h.usuario || 'Agente Anónimo'}</p>

              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <button
                  className="btn-ok"
                  onClick={() => aprobarHistoria(h.id)}
                  style={{ flex: 1 }}
                >
                  ✅ APROBAR
                </button>

                <button
                  className="btn-del"
                  onClick={() => eliminarHistoria(h.id)}
                  style={{ flex: 1 }}
                >
                  🗑️ ELIMINAR
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RevisarHistorias;