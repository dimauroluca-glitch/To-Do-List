const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// 1. DEFINIZIONE DEL MODELLO (Spostato all'inizio)
const ContattoSchema = new mongoose.Schema({
    nome: String,
    email: String,
    data: { type: Date, default: Date.now }
});
const Contatto = mongoose.model('Contatto', ContattoSchema);

// 2. CONVERSIONE E CONNESSIONE AL DATABASE (Adesso la sintassi è corretta)
if (!MONGODB_URI) {
    console.error("ERRORE: MONGODB_URI non configurata su Render!");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('🟢 MongoDB collegato con successo!'))
        .catch(err => console.error('🔴 Errore MongoDB:', err));
}

// 3. MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// 4. ROTTA PER RICEVERE E SALVARE I DATI
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

// NUOVA ROTTA: Prende l'ultima lista salvata su MongoDB e la manda al browser
app.get('/prendi-dati', async (req, res) => {
    try {
        // Cerca l'ultimo documento inserito nel database
        const ultimaLista = await Lista.findOne().sort({ data: -1 });
        if (!ultimaLista) {
            return res.status(200).json({ elementi: [] }); // Se il DB è vuoto, manda una lista vuota
        }
        res.status(200).json(ultimaLista);
    } catch (error) {
        console.error("Errore nel recupero dei dati:", error);
        res.status(500).send("Errore nel recupero dei dati.");
    }
});

app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Server attivo con successo!`);
    console.log(` Apri il browser su: http://localhost:${PORT}`);
    console.log(`=============================================`);
});
