const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
// 1. MODELLO AGGIORNATO (La data ora è DENTRO ogni singolo elemento)
const ListaSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    elementi: [{
        testo: String,
        completato: Boolean,
        data: String
    }],
    ultimoAggiornamento: { type: Date, default: Date.now }
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
// 4. ROTTA PER SALVARE LA LISTA
app.post('/invia-dati', async (req, res) => {
    try {
        const { userId, elementi } = req.body;
        if (!userId) return res.status(400).send("ID utente mancante.");
        await Lista.findOneAndUpdate(
            { userId: userId },
            { elementi: elementi, ultimoAggiornamento: Date.now() },
            { upsert: true, new: true }
        );
        res.status(200).send("Dati salvati con successo!");
    } catch (error) {
        console.error("Errore salvataggio:", error);
        res.status(500).send("Errore durante il salvataggio.");
    }
});
// 5. ROTTA PER RECUPERARE LA LISTA
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
// 6. NUOVA ROTTA SICURA PER ONESIGNAL (Chiamata dal frontend)
app.post('/programma-notifica', async (req, res) => {
    try {
        const { userId, testo, data } = req.body;
        if (!userId || !testo || !data) return res.status(400).send("Dati mancanti.");
        const dataFormattata = `${data} 09:00:00 GMT+0200`;
        const response = await fetch('https://onesignal.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic os_v2_app_htrzhsd5sngdpkd7ujulmnbwaixvezaqpwqujh4rfnmgxm2hf7vrjysi3mzxjdjjjlmpu4hu2kzfvwwzntlof6wlxtodtzolfv4p2ry'
            },
            body: JSON.stringify({
                app_id: "3ce393c8-7d93-4c37-a87f-a268b6343602",
                include_aliases: { "external_id": [userId] },
                target_channel: "push",
                contents: { "it": `Promemoria: ${testo}`, "en": `Reminder: ${testo}` },
                headings: { "it": "Task in scadenza oggi!", "en": "Task deadline today!" },
                send_after: dataFormattata
            })
        });
        const risultato = await response.json();
        console.log("📅 Notifica programmata su OneSignal via Backend:", risultato);
        res.status(200).json(risultato);
    } catch (error) {
        console.error("Errore programmazione OneSignal su Backend:", error);
        res.status(500).send("Errore server notifiche.");
    }
});
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Server attivo con successo!`);
    console.log(`=============================================`);
});
