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
// 6. ROTTA CORRETTA E SICURA PER ONESIGNAL
app.post('/programma-notifica', async (req, res) => {
    try {
        const { userId, testo, data } = req.body;
        if (!userId || !testo || !data) {
            return res.status(400).send("Dati mancanti (userId, testo o data).");
        }
        if (!process.env.ONESIGNAL_API_KEY) {
            console.error("🔴 ATTENZIONE: La variabile ONESIGNAL_API_KEY è vuota su Render!");
        } else {
            console.log(`🟢 Chiave API rilevata (Inizia con: ${process.env.ONESIGNAL_API_KEY.substring(0, 10)}...)`);
        }
        const dataTest = new Date(data);
        const offsetMinuti = dataTest.getTimezoneOffset();
        const offsetOre = Math.abs(offsetMinuti / 60);
        const stringaOffset = offsetMinuti <= 0 
            ? `+${String(offsetOre).padStart(2, '0')}00` 
            : `-${String(offsetOre).padStart(2, '0')}00`;
        const dataFormattata = `${data} 09:00:00 GMT${stringaOffset}`;
        console.log(`[OneSignal] Programmazione per la data: ${dataFormattata}`);
        const response = await fetch('https://onesignal.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
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
        const testoRisposta = await response.text();
        console.log("Risposta grezza da OneSignal:", testoRisposta);
        let risultato;
        try {
            risultato = JSON.parse(testoRisposta);
        } catch (e) {
            return res.status(400).json({ 
                successo: false, 
                messaggio: "L'URL di OneSignal nel codice è ancora errato o non aggiornato.", 
                rispostaGrezza: testoRisposta 
            });
        }
        if (risultato.errors) {
            console.error("🔴 Errore restituito da OneSignal:", risultato.errors);
            return res.status(400).json({ successo: false, errori: risultato.errors });
        }
        console.log("📅 Notifica programmata su OneSignal via Backend:", risultato);
        res.status(200).json({ successo: true, risultato });
    } catch (error) {
        console.error("Errore generico programmazione OneSignal:", error);
        res.status(500).json({ 
            successo: false, 
            messaggio: "Errore interno del server", 
            dettaglioErrore: error.message 
        });
    }
});
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Server attivo con successo!`);
    console.log(`=============================================`);
});
