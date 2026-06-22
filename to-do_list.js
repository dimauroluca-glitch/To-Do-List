let isLoading = false;

function ottieniUserId() {
    let userId = localStorage.getItem('todo_user_id');
    if (!userId) {
        userId = 'utente_' + Math.random().toString(36).substring(2, 15) + Date.now();
        localStorage.setItem('todo_user_id', userId);
    }
    return userId;
}

const MY_USER_ID = ottieniUserId();

// 1. SALVATAGGIO AUTOMATICO AGGIORNATO (Raccoglie testo e stato check)
function salvaInAutomatico() {
    if (isLoading) return;

    const gruppi = document.querySelectorAll('.input-group');
    const listaOggetti = [];

    gruppi.forEach(gruppo => {
        const input = grupo.querySelector('.input');
        const bottoneCheck = gruppo.querySelector('.check');
        
        if (input && input.value.trim() !== "") {
            listaOggetti.push({
                testo: input.value.trim(),
                completato: bottoneCheck.dataset.complete === 'true'
            });
        }
    });

    fetch('/invia-dati', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: MY_USER_ID, elementi: listaOggetti })
    })
    .then(response => {
        if (response.ok) {
            console.log("🟢 Database sincronizzato (Testo + Stato).");
        }
    })
    .catch(error => console.error("Errore salvataggio automatico:", error));
}

// 2. FUNZIONE GENERAZIONE INPUT MODIFICATA (Accetta parametri per il ripristino)
function addInput(testoIniziale = '', spuntatoIniziale = false){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '';
    newInput.classList.add('input');
    newInput.value = testoIniziale; // Imposta il vecchio testo se esiste
    
    newInput.onchange = function() {
        salvaInAutomatico();
    };

    const complete = document.createElement('button');
    complete.textContent = '✓';
    complete.classList.add('check');
    
    // Funzione per applicare lo stile grafico del completamento
    function applicaStileStato(isComplete) {
        if(isComplete){
            complete.dataset.complete = 'true';
            complete.style.backgroundColor = '#1e7e34';
            newInput.style.backgroundColor = '#28a745';
            newInput.style.borderColor = '#28a745';
            newInput.disabled = true;
        } else {
            complete.dataset.complete = 'false';
            complete.style.backgroundColor = '#28a745';
            newInput.style.backgroundColor = '#ffffff';
            newInput.style.borderColor = '#ffffff';
            newInput.disabled = false;
        }
    }

    // Applica lo stato iniziale (utile per quando si carica dal database)
    applicaStileStato(spuntatoIniziale);

    complete.onclick = function(){
        const nuovoStato = complete.dataset.complete !== 'true';
        applicaStileStato(nuovoStato);
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

document.getElementById('addInput').addEventListener('click', () => addInput());

// 3. FUNZIONE CARICAMENTO MODIFICATA (Passa testo e stato alla riga)
function caricaDatiDaMongoDB() {
    isLoading = true;

    fetch('/prendi-dati', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: MY_USER_ID })
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.elementi && data.elementi.length > 0) {
            document.getElementById('inputContainer').innerHTML = '';
            
            data.elementi.forEach(elemento => {
                // Passa sia il testo che lo stato salvato (true/false)
                addInput(elemento.testo, elemento.completato); 
            });
        }
    })
    .catch(error => console.error("Errore nel caricamento iniziale:", error))
    .finally(() => {
        isLoading = false;
    });
}

window.addEventListener('DOMContentLoaded', caricaDatiDaMongoDB);
