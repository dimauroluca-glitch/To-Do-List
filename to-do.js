const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// 1. MODELLO AGGIORNATO CON USERID
const ListaSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Identifica il dispositivo
    elementi: [String],
    data: { type: Date, default: Date.now }
});
const Lista = mongoose.model('Lista', ListaSchema);

// 2. CONNESSIONE AL DATABASE
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

// 4. ROTTA PER SALVARE LA LISTA DI UNO SPECIFICO UTENTE
app.post('/invia-dati', async (req, res) => {
    try {
        const { userId, elementi } = req.body;
        if (!userId) return res.status(400).send("ID utente mancante.");

        // Cerca se esiste già una lista per questo utente e la aggiorna, altrimenti ne crea una nuova
        await Lista.findOneAndUpdate(
            { userId: userId },
            { elementi: elementi, data: Date.now() },
            { upsert: true, new: true }
        );

        res.status(200).send("Dati salvati con successo!");
    } catch (error) {
        console.error("Errore salvataggio:", error);
        res.status(500).send("Errore durante il salvataggio.");
    }
});

// 5. ROTTA PER RECUPERARE LA LISTA DI UNO SPECIFICO UTENTE
app.post('/prendi-dati', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).send("ID utente mancante.");

        const ultimaLista = await Lista.findOne({ userId: userId });
        if (!ultimaLista) {
            return res.status(200).json({ elementi: [] });
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
    console.log(`=============================================`);
});
