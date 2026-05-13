const bcrypt = require('bcryptjs');

async function gen() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('142536', salt);
    console.log(hash);
}

gen();
