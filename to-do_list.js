// Funzione per raccogliere i dati e inviarli in automatico a MongoDB
function salvaInAutomatico() {
    const tuttiGliInput = document.querySelectorAll('.input-group .input');
    const listaTesti = [];

    tuttiGliInput.forEach(input => {
        const testoPulito = input.value.trim();
        // Salviamo solo i campi che non sono vuoti
        if (testoPulito !== "") {
            listaTesti.push(testoPulito);
        }
    });

    // Invia i dati a Render in background (senza mostrare fastidiosi alert)
    fetch('/invia-dati', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ elementi: listaTesti })
    })
    .then(response => {
        if (response.ok) {
            console.log("🟢 Database aggiornato in automatico.");
        }
    })
    .catch(error => console.error("Errore salvataggio automatico:", error));
}

// Funzione originale modificata per attivare il salvataggio automatico
function addInput(){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '';
    newInput.classList.add('input');
    
    // Salva quando l'utente smette di scrivere o cambia input
    newInput.onchange = function() {
        salvaInAutomatico();
    };

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
        // Salva lo stato aggiornato dopo aver cliccato la spunta
        salvaInAutomatico();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Elimina';
    deleteBtn.classList.add('delete');
    deleteBtn.onclick = function(){
        inputGroup.remove();
        // Salva lo stato aggiornato dopo aver rimosso l'elemento
        salvaInAutomatico();
    }

    inputGroup.appendChild(newInput);
    inputGroup.appendChild(complete);
    inputGroup.appendChild(deleteBtn);
    document.getElementById('inputContainer').appendChild(inputGroup);
    
    // Salva anche quando viene creato un nuovo input vuoto (opzionale)
    salvaInAutomatico();
}

document.getElementById('addInput').addEventListener('click', addInput);
// Funzione che scarica i dati da MongoDB e ripopola la pagina
function caricaDatiDaMongoDB() {
    fetch('/prendi-dati')
        .then(response => response.json())
        .then(data => {
            // Se ci sono elementi salvati nel database
            if (data && data.elementi && data.elementi.length > 0) {
                // Svuota prima il contenitore per sicurezza
                document.getElementById('inputContainer').innerHTML = '';
                
                // Per ogni testo salvato, crea un nuovo input e inserisci il testo
                data.elementi.forEach(testo => {
                    // Usiamo la tua funzione originale per creare la riga
                    addInput(); 
                    
                    // Prendiamo l'ultimo input appena creato e ci scriviamo dentro il testo memorizzato
                    const tuttiGliInput = document.querySelectorAll('.input-group .input');
                    const ultimoInputCreato = tuttiGliInput[tuttiGliInput.length - 1];
                    if (ultimoInputCreato) {
                        ultimoInputCreato.value = testo;
                    }
                });
            }
        })
        .catch(error => console.error("Errore nel caricamento iniziale:", error));
}

// Avvia il caricamento automatico dei dati NON APPENA la pagina si è aperta del tutto
window.addEventListener('DOMContentLoaded', caricaDatiDaMongoDB);
