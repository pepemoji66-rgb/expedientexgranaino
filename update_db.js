require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
    };

    try {
        const connection = await mysql.createConnection(config);
        
        const c1_title = "The Mystery of the Moor's Chair";
        const c1_desc = "A nameless corpse in front of the Alhambra.\r\nThe Moor's Chair is one of the most emblematic viewpoints in Granada, a place loaded with history that watches over the Generalife from above. However, in September 2005, this spot became the scene of a real puzzle for the Homicide Group of the National Police. Hikers walking around the hill discovered the body of a man half-buried in a dirt area. Upon unearthing him, the investigators' surprise was immense: the corpse belonged to a middle-aged man wearing high-quality clothing and expensive brands, but he had no identification whatsoever, no wallet, no keys, no mobile phone. They had cleaned him out completely.\r\n\r\nThe autopsy confirmed a violent death and that the body had been there for a short time. The police poured all their efforts into identifying him: matching his fingerprints and DNA with missing persons databases across Spain and internationally through Interpol. The result was an absolute void. No one reported him missing, no one claimed the body, and no clue managed to reveal who this elegant man buried at the gates of the Alhambra was. Two decades later, the case remains in Granada's unsolved files. A true real mystery that proves that sometimes, reality is stranger than fiction.";

        const c2_title = "The Legend of Cortijo Jurado";
        const c2_desc = "Secrets of terror under the soil of Campanillas.\r\nOn the outskirts of Malaga, in the Campanillas neighborhood, stands the imposing and ruined Cortijo Jurado, a neo-Gothic mansion built in the 19th century by the wealthy Heredia family. What started as an agricultural recreational estate has become, over the decades, the epicenter of mystery and dark chronicles in southern Spain. The darkest legend weighing on its walls speaks of the disappearance of several young girls from the area between 1890 and 1920. Rumors of the time suggested they were victims of macabre rituals carried out by the high aristocracy, whose participants used an alleged network of secret underground tunnels to move the bodies unseen.\r\n\r\nDespite the estate being the scene of countless paranormal investigations and locals swearing to have seen lights and heard wails among its empty rooms, the judicial and police reality remains an enigma. Officially, those hidden passages were never found, nor were human remains found in the subsoil to confirm the identities of the missing girls. The files from that time blurred into popular myth and the secrecy of influential families of the past century. Cortijo Jurado still stands, devoured by abandonment, keeping the truth locked away as to whether it was the scene of atrocious crimes or the birthplace of Andalusia's most terrifying urban legend.";

        const c3_title = "The Crime of Los Galindos";
        const c3_desc = "\r\nFive deaths and a mystery buried under the Seville sun.\r\nOn July 22, 1975, under suffocating heat of over forty degrees, the Sevillian estate of Los Galindos became the scene of one of the greatest massacres in Spanish criminal history. Five people—the foreman, his wife, two tractor drivers, and a harvester—were brutally murdered in different parts of the property. Some were bludgeoned with a heavy metal piece, others shot with a hunting rifle, and two were set on fire in a straw shed to try to erase the tracks. What the Civil Guard initially thought was a bout of madness from one of the employees soon revealed itself as a perfectly executed plan.\r\n\r\nThe judicial investigation was an absolute disaster: the crime scene was trampled by dozens of onlookers, crucial evidence was destroyed, and the initial autopsies failed miserably. When the case passed into the hands of the famous judge Heriberto Asensio, it was discovered that the threads of the crime pointed much higher, splashing onto a financial fraud related to black wheat money that the foreman was about to denounce. There were suspects, military personnel involved, and landowners under the microscope, but the pact of silence was stronger. The case legally prescribed in 1995. Fifty years later, the walls of Los Galindos still keep the secret of who ordered the trigger pulled.";

        await connection.execute("UPDATE casos_abiertos SET titulo_en = ?, contenido_en = ? WHERE id = 1", [c1_title, c1_desc]);
        await connection.execute("UPDATE casos_abiertos SET titulo_en = ?, contenido_en = ? WHERE id = 2", [c2_title, c2_desc]);
        await connection.execute("UPDATE casos_abiertos SET titulo_en = ?, contenido_en = ? WHERE id = 3", [c3_title, c3_desc]);

        console.log("Updated english texts.");
        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
