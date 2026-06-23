if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => {
      console.log('Service Worker registrato con successo!', reg);
      // Configura le notifiche push appena il Service Worker è pronto
      inizializzaPush(reg);
    })
    .catch(err => console.error('Errore registrazione Service Worker:', err));
}
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}
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
// Utility per convertire la chiave VAPID del server
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
// Richiede l'iscrizione push al browser e la invia al tuo server Node.js
async function inizializzaPush(reg) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    // Chiedi al tuo server la chiave pubblica VAPID (creeremo questa rotta sul server)
    const res = await fetch('/vapid-key');
    const { publicKey } = await res.json();
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    // Invia i dati di iscrizione al server per associarli a questo utente
    await fetch('/salva-iscrizione', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: MY_USER_ID, subscription })
    });
    console.log("🟢 Dispositivo iscritto alle notifiche push a pagina chiusa.");
  } catch (err) {
    console.error("Errore iscrizione push:", err);
  }
}
// 1. SALVATAGGIO AUTOMATICO (Incluso campo Data)
function salvaInAutomatico() {
    if (isLoading) return;
    const gruppi = document.querySelectorAll('.input-group');
    const listaOggetti = [];
    gruppi.forEach(gruppo => {
        const input = gruppo.querySelector('.input');
        const bottoneCheck = gruppo.querySelector('.check');
        const dateInput = gruppo.querySelector('.date-input');
        if (input && input.value.trim() !== "") {
            listaOggetti.push({
                testo: input.value.trim(),
                completato: bottoneCheck.dataset.complete === 'true',
                data: dateInput ? dateInput.value : ""
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
            console.log("🟢 Database sincronizzato (Testo + Stato + Data).");
        }
    })
    .catch(error => console.error("Errore salvataggio automatico:", error));
}
// 2. FUNZIONE GENERAZIONE INPUT
function addInput(testoIniziale = '', spuntatoIniziale = false, dataIniziale = ''){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.classList.add('date-input');
    if (dataIniziale === '') {
        dateInput.value = new Date().toISOString().split('T')[0];
    } else {
        dateInput.value = dataIniziale;
    }
    dateInput.onchange = function() {
        salvaInAutomatico();
    };
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '';
    newInput.classList.add('input');
    newInput.value = testoIniziale;
    newInput.onchange = function() {
        salvaInAutomatico();
    };
    const complete = document.createElement('button');
    complete.textContent = '✓';
    complete.classList.add('check');  
    function applicaStileStato(isComplete) {
        if(isComplete){
            complete.dataset.complete = 'true';
            complete.style.backgroundColor = '#1e7e34';
            newInput.style.backgroundColor = '#28a745';
            newInput.style.borderColor = '#28a745';
            newInput.disabled = true;
            dateInput.disabled = true;
        } else {
            complete.dataset.complete = 'false';
            complete.style.backgroundColor = '#28a745';
            newInput.style.backgroundColor = '#ffffff';
            newInput.style.borderColor = '#ffffff';
            newInput.disabled = false;
            dateInput.disabled = false;
        }
    }
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
    inputGroup.appendChild(dateInput);
    inputGroup.appendChild(newInput);
    inputGroup.appendChild(complete);
    inputGroup.appendChild(deleteBtn);
    document.getElementById('inputContainer').appendChild(inputGroup);
    salvaInAutomatico();
}
document.getElementById('addInput').addEventListener('click', () => addInput());
// 3. FUNZIONE CARICAMENTO AGGIORNATA
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
                addInput(elemento.testo, elemento.completato, elemento.data); 
            });
            pianificaNotificheLocali(data.elementi);
        }
    })
    .catch(error => console.error("Errore nel caricamento iniziale:", error))
    .finally(() => {
        isLoading = false;
    });
}
async function pianificaNotificheLocali(elementi) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const taskAttivi = elementi.filter(e => !e.completato && e.data);
        navigator.serviceWorker.controller.postMessage({
            azione: 'configura_scadenze',
            tasks: taskAttivi
        });
    }
}
window.addEventListener('DOMContentLoaded', caricaDatiDaMongoDB);
