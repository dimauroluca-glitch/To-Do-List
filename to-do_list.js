let isLoading = false;

// Genera o recupera un ID unico per questo specifico dispositivo/browser
function ottieniUserId() {
    let userId = localStorage.getItem('todo_user_id');
    if (!userId) {
        // Genera un ID casuale unico (es. utente_168492049201)
        userId = 'utente_' + Math.random().toString(36).substring(2, 15) + Date.now();
        localStorage.setItem('todo_user_id', userId);
    }
    return userId;
}

const MY_USER_ID = ottieniUserId();

// Funzione salvataggio automatico modificata con ID utente
function salvaInAutomatico() {
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
        // Invia sia l'ID del dispositivo sia i testi inseriti
        body: JSON.stringify({ userId: MY_USER_ID, elementi: listaTesti })
    })
    .then(response => {
        if (response.ok) {
            console.log("🟢 Database aggiornato per l'utente: " + MY_USER_ID);
        }
    })
    .catch(error => console.error("Errore salvataggio automatico:", error));
}

function addInput(){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '';
    newInput.classList.add('input');
    
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

// Funzione caricamento modificata per richiedere SOLO i dati del dispositivo attuale
function caricaDatiDaMongoDB() {
    isLoading = true;

    fetch('/prendi-dati', {
        method: 'POST', // Modificato in POST per poter inviare l'ID in totale sicurezza
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: MY_USER_ID })
    })
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
        isLoading = false;
    });
}

window.addEventListener('DOMContentLoaded', caricaDatiDaMongoDB);

