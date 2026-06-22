// --- 1. IL TUO CODICE ORIGINALE (GESTIONE INTERFACCIA DINAMICA) ---
function addInput(){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '';
    newInput.classList.add('input');
    const complete = document.createElement('button');
    complete.textContent = '✓';
    complete.classList.add('check');
    complete.dataset.complete = 'false';
    complete.onclick = function(){
        if(complete.dataset.complete === 'true'){
            complete.dataset.complete = 'false';
            complete.style.backgroundColor = '#28a745';
            newInput.style.backgroundColor = '#ffffff';
            newInput.style.borderColor = '#ffffff';
            newInput.disabled = false;
        }else{
            complete.dataset.complete = 'true';
            complete.style.backgroundColor = '#1e7e34';
            newInput.style.backgroundColor = '#28a745';
            newInput.style.borderColor = '#28a745';
            newInput.disabled = true;
        }
    };
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Elimina';
    deleteBtn.classList.add('delete');
    deleteBtn.onclick = function(){
        inputGroup.remove();
    }
    inputGroup.appendChild(newInput);
    inputGroup.appendChild(complete);
    inputGroup.appendChild(deleteBtn);
    document.getElementById('inputContainer').appendChild(inputGroup);
}

document.getElementById('addInput').addEventListener('click', addInput);


// --- 2. NUOVO CODICE (CONNESSIONE A MONGODB TRAMITE RENDER) ---
function salvaDatiSuMongoDB() {
    // Seleziona tutti gli input di testo generati dentro la pagina
    const tuttiGliInput = document.querySelectorAll('.input-group .input');
    const listaTesti = [];

    // Prende i valori inseriti dall'utente (ignorando i campi lasciati vuoti)
    tuttiGliInput.forEach(input => {
        const testoPulito = input.value.trim();
        if (testoPulito !== "") {
            listaTesti.push(testoPulito);
        }
    });

    // Se l'utente non ha scritto nulla, blocca l'invio ed evita dati vuoti nel database
    if (listaTesti.length === 0) {
        alert("Inserisci del testo in almeno un campo prima di salvare!");
        return;
    }

    // Effettua la richiesta POST verso il tuo server Render
    fetch('/invia-dati', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ elementi: listaTesti }) // Invia l'array di testi
    })
    .then(response => {
        if (response.ok) {
            alert("🟢 Lista salvata con successo nel database MongoDB cloud!");
        } else {
            alert("🔴 Errore durante il salvataggio sul server.");
        }
    })
    .catch(error => {
        console.error("Errore di rete:", error);
        alert("🔴 Impossibile connettersi al server. Verifica la connessione.");
    });
}

// Collega l'azione di salvataggio al pulsante con id="btnSalva"
document.getElementById('btnSalva').addEventListener('click', salvaDatiSuMongoDB);
