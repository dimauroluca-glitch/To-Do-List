const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const ContattoSchema = new mongoose.Schema({
    nome: String,
    email: String,
    data: { type: Date, default: Date.now }
});
const Contatto = mongoose.model('Contatto', ContattoSchema);
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
app.post('/invia-dati', async (req, res) => {
    try {
        const nuovoContatto = new Contatto({
            nome: req.body.nome,
            email: req.body.email
        });
        await nuovoContatto.save();
        res.status(200).send("Dati salvati con successo nel database cloud!");
    } catch (error) {
        console.error("Errore salvataggio:", error);
        res.status(500).send("Errore durante il salvataggio dei dati.");
    }
});
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Server attivo con successo!`);
    console.log(` Apri il browser su: http://localhost:${PORT}`);
    console.log(`=============================================`);
});
