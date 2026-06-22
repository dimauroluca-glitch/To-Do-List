const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("ERRORE: MONGODB_URI non configurata su Render!");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('🟢 MongoDB collegato con successo!'))
        .catch(err => console.error('🔴 Errore MongoDB:', err));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Server attivo con successo!`);
    console.log(` Apri il browser su: http://localhost:${PORT}`);
    console.log(`=============================================`);
});
