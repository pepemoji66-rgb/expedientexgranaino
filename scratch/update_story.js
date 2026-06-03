const db = require('../db');

const contenido = `Esta historia es totalmente cierta. Omito los nombres reales por respeto a los protagonistas, pero eran personas de mi total confianza. Ambos han fallecido ya, pero puedo asegurar que su testimonio es completamente fiable.

Corrían los finales de los años cuarenta del pasado siglo. España se encontraba sumida en la pobreza de la posguerra y la necesidad marcaba el ritmo de la vida. Dos hermanos se dirigieron a unos cortijos alejados del pueblo, situados a gran distancia en medio de la nada. Era verano y una luna espléndida dominaba el cielo, iluminando el campo casi como si fuese de día; la contaminación lumínica no existía y las estrellas lucían en todo su esplendor.

Los dos hermanos se encaminaban a guardar el trigo que se había segado y descansaba en gavillas esperando a ser trillado. En aquellos tiempos de escasez, el grano no se podía dejar solo: cualquiera podía llevárselo. Para aquellos niños —uno de unos doce años y el otro de diez—, aquello era casi una aventura, a pesar de la dureza del trabajo.

Cuando llegaron al sitio y después de comer algo, se dispusieron a preparar el camastro de paja donde iban a pasar la noche. De pronto, el hermano mayor exclamó:

— ¡Mira, mira, Juan! ¡Una vieja! Por ahí va una vieja...

Ambos se alertaron y escudriñaron los matorrales, pero no vieron nada. El menor dijo que él no había visto silueta alguna y, al cabo de un rato, intentaron conciliar el sueño. Sin embargo, cuando se estaban acostando, fue el pequeño quien saltó:

— ¡Antonio, Antonio! ¡Ahora la he visto yo! ¡Es cierto, por ahí va!

Justo en ese momento, el viento trajo desde el pueblo el sonido lejano de una campanada del reloj de la iglesia: era la una de la madrugada.

De nuevo se pusieron a buscar por todas partes, esta vez con la horca en la mano, dispuestos a pinchar en la paja y en los matorrales donde les había parecido distinguir la silueta de la "vieja". Eran valientes y lo primero que pensaron fue que alguien quería asustarles para que huyeran despavoridos y así poder robarles el trigo. Pero no encontraron a nadie. Al rato, volvieron a acostarse, aunque durmiendo con un ojo abierto por si acaso.

Con el alba llegó el nuevo día y, cuando la gente empezó a llegar a los cortijos para comenzar la trilla, ellos emprendieron el regreso al pueblo con su mula. Al llegar a su calle, se quedaron petrificados: había un gentío acumulado en la puerta de su casa.

Alertados, preguntaron qué había pasado. Su madre, con los ojos empañados, les dio la noticia: su abuela había muerto por la noche.

El hermano mayor, recordando el extraño suceso de la era, le preguntó a su madre:
— ¿Fue a la una de la madrugada?
— Sí... —respondió ella—. A esa hora exacta murió.

Los dos hermanos se miraron en silencio, sabiendo al unísono lo que había ocurrido: su abuela había ido hasta la era para despedirse de ellos.

Esta historia es real.`;

db.query('UPDATE expedientes SET contenido = ?, titulo = ?, usuario_nombre = ?, tipo = ?, estado = ? WHERE id = 7', 
    [contenido, 'LA VISITA EN LA ERA', 'Pepe', 'jefe', 'aprobado'], 
    (err) => {
        if (err) {
            console.error('❌ Error:', err);
            process.exit(1);
        }
        console.log('✅ RELATO CARGADO CORRECTAMENTE EN EL ID 7');
        process.exit(0);
    }
);
