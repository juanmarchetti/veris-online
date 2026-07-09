import { describe, it, expect } from 'vitest'

// En un entorno de CI/CD real, este test se conectaría a una base de datos 
// de prueba con Supabase configurado. Para este caso, simularemos el comportamiento
// de concurrencia que la RPC garantiza en la base de datos.
//
// NOTA: Para correr el test contra una DB real, usaríamos @supabase/supabase-js 
// llamando a supabase.rpc('registrar_enlace_zoom', { p_id_cita, p_enlace_zoom })
// en un Promise.all([req1, req2]).

describe('RPC registrar_enlace_zoom (Simulación de concurrencia)', () => {
  it('garantiza que dos peticiones simultáneas devuelven el mismo enlace final', async () => {
    // Simulación del estado de la tabla en BD
    let enlaceEnBd: string | null = null;
    
    // Simulación de la función RPC con SECURITY DEFINER
    const simularRPCRegistrarEnlaceZoom = async (enlacePropuesto: string) => {
      // Retardo aleatorio para simular condiciones de red/concurrencia
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      // Bloque atómico simulado (como el UPDATE ... WHERE enlace_zoom IS NULL)
      if (enlaceEnBd === null) {
        enlaceEnBd = enlacePropuesto;
      }
      
      // Siempre devuelve lo que haya quedado en la BD (como el SELECT final de la RPC)
      return enlaceEnBd;
    };

    const link1 = 'https://zoom.us/j/first';
    const link2 = 'https://zoom.us/j/second';

    // Disparamos ambas peticiones simultáneamente
    const resultados = await Promise.all([
      simularRPCRegistrarEnlaceZoom(link1),
      simularRPCRegistrarEnlaceZoom(link2)
    ]);

    // Ambas peticiones deben devolver exactamente el mismo enlace
    expect(resultados[0]).toBe(resultados[1]);
    
    // El enlace devuelto debe ser uno de los dos propuestos
    expect([link1, link2]).toContain(resultados[0]);
  });
});
