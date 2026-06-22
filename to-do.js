const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// 1. DEFINIZIONE DEL MODELLO (Aggiornato per salvare la lista di elementi)
const ListaSchema = new mongoose.Schema({
    elementi: [String], // Array di stringhe per salvare i testi dei tuoi input
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

// 3. MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// 4. ROTTA PER SALVARE O AGGIORNARE LA LISTA
app.post('/invia-dati', async (req, res) => {
    try {
        // Creiamo un nuovo documento con l'array "elementi" inviato dal frontend
        const nuovaLista = new Lista({
            elementi: req.body.elementi
        });
        await nuovaLista.save();
        res.status(200).send("Dati salvati con successo nel database cloud!");
    } catch (error) {
        console.error("Errore salvataggio:", error);
        res.status(500).send("Errore durante il salvataggio dei dati.");
    }
});

// 5. ROTTA PER RECUPERARE LA LISTA (Sincronizzata con il modello Lista)
app.get('/prendi-dati', async (req, res) => {
    try {
        // Cerca l'ultimo inserimento nel database ordinando per data decrescente
        const ultimaLista = await Lista.findOne().sort({ data: -1 });
        if (!ultimaLista) {
            return res.status(200).json({ elementi: [] }); // Se il DB è vuoto, manda un array vuoto
        }
        res.status(200).json(ultimaLista);
    } catch (error) {
        console.error("Errore nel recupero dei dati:", error);
        res.status(500).send("Errore nel recupero dei dati.");
    }
});

// 6. AVVIO DEL SERVER
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Server attivo con successo!`);
    console.log(` Apri il browser su: http://localhost:${PORT}`);
    console.log(`=============================================`);
});
