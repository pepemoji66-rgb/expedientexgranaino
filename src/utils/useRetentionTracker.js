import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';

/**
 * 📊 RADAR DE RETENCIÓN — Hook de tracking de tiempo en página
 * 
 * Mide el tiempo REAL que el usuario pasa activo en la web:
 * - Pausa el cronómetro cuando cambia de pestaña (visibilitychange)
 * - Envía heartbeats al servidor cada 30 segundos
 * - Envía eventos GA4 en hitos de tiempo (30s, 1min, 3min, 5min, 10min)
 * - Envía beacon al cerrar la página (beforeunload)
 * - Cuenta las páginas visitadas (navegación SPA)
 */
const useRetentionTracker = (userAuth) => {
  const location = useLocation();
  
  // Refs para mantener estado sin re-renders
  const sesionId = useRef(null);
  const segundosActivos = useRef(0);
  const segundosTotales = useRef(0);
  const paginasVistas = useRef(1);
  const estaActivo = useRef(true);
  const intervaloContador = useRef(null);
  const intervaloHeartbeat = useRef(null);
  const hitosEnviados = useRef(new Set());
  const rutaAnterior = useRef(null);
  const iniciado = useRef(false);

  // Generar UUID para la sesión
  const generarUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  };

  // Detectar tipo de dispositivo
  const detectarDispositivo = () => {
    const ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
  };

  // Enviar evento a GA4
  const enviarEventoGA4 = useCallback((nombreEvento, params = {}) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', nombreEvento, {
        custom_metric: true,
        sesion_id: sesionId.current,
        ...params
      });
    }
  }, []);

  // Comprobar hitos de tiempo y enviar eventos GA4
  const comprobarHitos = useCallback(() => {
    const hitos = [
      { segundos: 30, nombre: 'tiempo_en_pagina_30s' },
      { segundos: 60, nombre: 'tiempo_en_pagina_1min' },
      { segundos: 180, nombre: 'tiempo_en_pagina_3min' },
      { segundos: 300, nombre: 'tiempo_en_pagina_5min' },
      { segundos: 600, nombre: 'tiempo_en_pagina_10min' }
    ];

    hitos.forEach(hito => {
      if (segundosActivos.current >= hito.segundos && !hitosEnviados.current.has(hito.nombre)) {
        hitosEnviados.current.add(hito.nombre);
        enviarEventoGA4(hito.nombre, {
          duracion_activa: segundosActivos.current,
          paginas_vistas: paginasVistas.current,
          ruta_actual: location.pathname
        });
        console.log(`📊 RADAR RETENCIÓN: Hito alcanzado → ${hito.nombre} (${segundosActivos.current}s activos)`);
      }
    });
  }, [enviarEventoGA4, location.pathname]);

  // Enviar heartbeat al servidor
  const enviarHeartbeat = useCallback(() => {
    const datos = {
      sesion_id: sesionId.current,
      duracion_segundos: segundosActivos.current,
      duracion_total_segundos: segundosTotales.current,
      paginas_vistas: paginasVistas.current,
      ruta_actual: location.pathname
    };

    // Usar fetch para evitar problemas con axios en beforeunload
    fetch(`${API_BASE_URL}/api/sesion/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
      keepalive: true
    }).catch(() => {});
  }, [location.pathname]);

  // Enviar fin de sesión (con sendBeacon para beforeunload)
  const enviarFinSesion = useCallback(() => {
    const datos = {
      sesion_id: sesionId.current,
      duracion_segundos: segundosActivos.current,
      duracion_total_segundos: segundosTotales.current,
      paginas_vistas: paginasVistas.current
    };

    // sendBeacon es más fiable que fetch en beforeunload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${API_BASE_URL}/api/sesion/fin`,
        new Blob([JSON.stringify(datos)], { type: 'application/json' })
      );
    } else {
      fetch(`${API_BASE_URL}/api/sesion/fin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
        keepalive: true
      }).catch(() => {});
    }

    enviarEventoGA4('sesion_finalizada', {
      duracion_activa: segundosActivos.current,
      duracion_total: segundosTotales.current,
      paginas_vistas: paginasVistas.current
    });
  }, [enviarEventoGA4]);

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;

    // Generar ID de sesión
    sesionId.current = generarUUID();
    rutaAnterior.current = location.pathname;

    console.log(`📊 RADAR RETENCIÓN: Sesión iniciada → ${sesionId.current}`);

    // Registrar inicio en el servidor
    fetch(`${API_BASE_URL}/api/sesion/inicio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sesion_id: sesionId.current,
        ruta_entrada: location.pathname,
        dispositivo: detectarDispositivo(),
        agente: userAuth?.nombre || null
      })
    }).catch(() => {});

    // --- CRONÓMETRO: Contar segundos cada segundo ---
    intervaloContador.current = setInterval(() => {
      segundosTotales.current += 1;
      if (estaActivo.current) {
        segundosActivos.current += 1;
        comprobarHitos();
      }
    }, 1000);

    // --- HEARTBEAT: Enviar datos cada 30 segundos ---
    intervaloHeartbeat.current = setInterval(() => {
      enviarHeartbeat();
    }, 30000);

    // --- VISIBILITYCHANGE: Pausar/reanudar cronómetro ---
    const handleVisibilityChange = () => {
      if (document.hidden) {
        estaActivo.current = false;
        console.log('📊 RADAR RETENCIÓN: Pestaña oculta → cronómetro pausado');
      } else {
        estaActivo.current = true;
        console.log('📊 RADAR RETENCIÓN: Pestaña visible → cronómetro reanudado');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // --- BEFOREUNLOAD: Enviar datos finales al cerrar ---
    const handleBeforeUnload = () => {
      enviarFinSesion();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // --- CLEANUP ---
    return () => {
      clearInterval(intervaloContador.current);
      clearInterval(intervaloHeartbeat.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      enviarFinSesion();
    };
  // eslint-disable-next-line
  }, []);

  // --- DETECTAR NAVEGACIÓN SPA ---
  useEffect(() => {
    if (rutaAnterior.current && rutaAnterior.current !== location.pathname) {
      paginasVistas.current += 1;
      
      enviarEventoGA4('navegacion_seccion', {
        ruta_anterior: rutaAnterior.current,
        ruta_nueva: location.pathname,
        paginas_vistas: paginasVistas.current,
        duracion_activa: segundosActivos.current
      });

      console.log(`📊 RADAR RETENCIÓN: Navegación → ${rutaAnterior.current} → ${location.pathname} (${paginasVistas.current} páginas)`);
    }
    rutaAnterior.current = location.pathname;
  }, [location.pathname, enviarEventoGA4]);

  // --- ACTUALIZAR AGENTE SI CAMBIA (login/logout) ---
  useEffect(() => {
    if (sesionId.current && userAuth?.nombre) {
      fetch(`${API_BASE_URL}/api/sesion/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: sesionId.current,
          duracion_segundos: segundosActivos.current,
          duracion_total_segundos: segundosTotales.current,
          paginas_vistas: paginasVistas.current,
          ruta_actual: location.pathname,
          agente: userAuth.nombre
        })
      }).catch(() => {});
    }
  // eslint-disable-next-line
  }, [userAuth]);
};

export default useRetentionTracker;
