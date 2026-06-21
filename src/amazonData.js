// Archivo de Configuración de Enlaces de Amazon
// Aquí puedes añadir los libros y banners para cada artículo usando su TIPO y su ID.
// Tipos posibles: 'misterio-', 'noticia-', 'exp-'

export const amazonData = {
    // EJEMPLO: Si Göbekli Tepe es un "Misterio Histórico" con ID 1 en la base de datos, usamos "misterio-1"
    "misterio-1": {
        banner: {
            titulo: "Lectura Recomendada: Göbekli Tepe",
            descripcion: "Profundiza en el origen de los dioses en el templo más antiguo de la humanidad.",
            link: "https://www.amazon.es/" // Cambia esto por tu enlace real de afiliado
        },
        bibliografia: [
            {
                titulo: "El Misterio de Göbekli Tepe",
                autor: "Andrew Collins",
                imagen_url: "https://m.media-amazon.com/images/I/71R2o5-jAUL._AC_UF894,1000_QL80_.jpg",
                link: "https://www.amazon.es/" // Enlace real de afiliado
            },
            {
                titulo: "Magos de los Dioses",
                autor: "Graham Hancock",
                imagen_url: "https://m.media-amazon.com/images/I/81h2N31Kk6L._AC_UF894,1000_QL80_.jpg",
                link: "https://www.amazon.es/" // Enlace real de afiliado
            }
        ]
    },
    
    // Puedes ir añadiendo más aquí abajo copiando el bloque anterior.
    // Ejemplo:
    // "exp-5": { banner: {...}, bibliografia: [...] }
};
