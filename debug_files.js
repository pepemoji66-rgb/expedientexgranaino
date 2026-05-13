const fs = require('fs');
const path = require('path');

const folders = ['uploads', 'uploads/imagenes', 'uploads/archivos', 'uploads/lugares', 'public/videos'];

folders.forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
        console.log(`Directory: ${f}`);
        console.log(fs.readdirSync(p));
    } else {
        console.log(`Directory ${f} DOES NOT EXIST`);
    }
});
