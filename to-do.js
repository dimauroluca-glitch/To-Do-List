const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = mongodb+srv:lucadimauro2009_db_user:BzqpaitwyKkNSmpk@cluster0.xezpfwy.mongodb.net/?appName=Cluster0;
if (!MONGODB_URI) {
    console.error("ATTENZIONE: MONGODB_URI non configurato nelle variabili d'ambiente!");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log(' Database MongoDB collegato con successo!'))
        .catch(err => console.error(' Errore di connessione al Database:', err));
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
