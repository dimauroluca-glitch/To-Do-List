// Variabile di controllo per evitare conflitti durante il caricamento iniziale
let isLoading = false;

// Funzione per raccogliere i dati e inviarli in automatico a MongoDB
function salvaInAutomatico() {
    // Se la pagina sta caricando i dati storici, blocca il salvataggio automatico momentaneamente
    if (isLoading) return;

    const tuttiGliInput = document.querySelectorAll('.input-group .input');
    const listaTesti = [];

    tuttiGliInput.forEach(input => {
        const testoPulito = input.value.trim();
        if (testoPulito !== "") {
            listaTesti.push(testoPulito);
        }
    });

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

// Funzione modificata per generare l'interfaccia
function addInput(){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '';
    newInput.classList.add('input');
    
    // Salva quando l'utente preme invio o cambia input
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
        salvaInAutomatico();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Elimina';
    deleteBtn.classList.add('delete');
    deleteBtn.onclick = function(){
        inputGroup.remove();
        salvaInAutomatico();
    }

    inputGroup.appendChild(newInput);
    inputGroup.appendChild(complete);
    inputGroup.appendChild(deleteBtn);
    document.getElementById('inputContainer').appendChild(inputGroup);
    
    salvaInAutomatico();
}

document.getElementById('addInput').addEventListener('click', addInput);

// Funzione che scarica i dati da MongoDB e ripopola la pagina senza creare conflitti
function caricaDatiDaMongoDB() {
    isLoading = true; // 1. Attiva il blocco del salvataggio automatico

    fetch('/prendi-dati')
        .then(response => response.json())
        .then(data => {
            if (data && data.elementi && data.elementi.length > 0) {
                document.getElementById('inputContainer').innerHTML = '';
                
                data.elementi.forEach(testo => {
                    addInput(); 
                    
                    const tuttiGliInput = document.querySelectorAll('.input-group .input');
                    const ultimoInputCreato = tuttiGliInput[tuttiGliInput.length - 1];
                    if (ultimoInputCreato) {
                        ultimoInputCreato.value = testo;
                    }
                });
            }
        })
        .catch(error => console.error("Errore nel caricamento iniziale:", error))
        .finally(() => {
            isLoading = false; // 2. Disattiva il blocco: da adesso in poi i cambi salveranno sul DB
        });
}

// Avvia il caricamento automatico
window.addEventListener('DOMContentLoaded', caricaDatiDaMongoDB);
