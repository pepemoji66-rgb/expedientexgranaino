const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            if (!filepath.includes('node_modules') && !filepath.includes('.git') && !filepath.includes('build')) {
                walk(filepath, filelist);
            }
        } else {
            if (file.toLowerCase().includes('roswell') || file.toLowerCase().includes('voynich')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

console.log("Searching for roswell.jpg or voynich.jpg...");
const results = walk('.');
console.log("Found:", results);
process.exit(0);
