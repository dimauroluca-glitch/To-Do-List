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
// 1. SALVATAGGIO AUTOMATICO (Incluso campo Data e invio a OneSignal)
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
            if (bottoneCheck.dataset.complete !== 'true' && dateInput && dateInput.value) {
                programmaNotificaSuOneSignal(input.value.trim(), dateInput.value);
            }
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
            console.log("🟢 Database MongoDB sincronizzato.");
        }
    })
    .catch(error => console.error("Errore salvataggio automatico:", error));
}
function programmaNotificaSuOneSignal(testoTask, dataScadenza) {
    const dataFormattata = `${dataScadenza} 09:00:00 GMT+0200`; 
    fetch('https://onesignal.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic os_v2_app_htrzhsd5sngdpkd7ujulmnbwaixvezaqpwqujh4rfnmgxm2hf7vrjysi3mzxjdjjjlmpu4hu2kzfvwwzntlof6wlxtodtzolfv4p2ry'
        },
        body: JSON.stringify({
            app_id: "3ce393c8-7d93-4c37-a87f-a268b6343602",
            include_aliases: { "external_id": [MY_USER_ID] },
            target_channel: "push",
            contents: { "it": `Promemoria: ${testoTask}`, "en": `Reminder: ${testoTask}` },
            headings: { "it": "Task in scadenza oggi!", "en": "Task deadline today!" },
            send_after: dataFormattata
        })
    })
    .then(res => res.json())
    .then(risultato => console.log("📅 Notifica programmata su cloud OneSignal:", risultato))
    .catch(err => console.error("Errore programmazione OneSignal:", err));
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
// 3. FUNZIONE CARICAMENTO DATI DA MONGODB
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
        }
    })
    .catch(error => console.error("Errore nel caricamento iniziale:", error))
    .finally(() => {
        isLoading = false;
    });
}
window.addEventListener('DOMContentLoaded', caricaDatiDaMongoDB);
window.OneSignalDeferred = window.OneSignalDeferred || [];
window.OneSignalDeferred.push(function(OneSignal) {
    const bottone = document.getElementById('btnNotifiche');
    if (bottone) {
        function gestisciVisibilitaBottone() {
            if (Notification.permission === 'granted' || OneSignal.Notifications.permission === true) {
                bottone.style.display = 'none';
                console.log("🔒 Notifiche attive. Bottone nascosto con successo.");
            } else {
                bottone.style.display = 'block';
            }
        }
        gestisciVisibilitaBottone();
        bottone.onclick = async () => {
            bottone.style.display = 'none';
            console.log("Richiesta permessi notifiche in corso...");
            try {
                await OneSignal.Notifications.requestPermission();
                if (Notification.permission === 'granted') {
                    alert("🟢 Notifiche attivate con successo! Riceverai i promemoria a pagina chiusa.");
                } else {
                    bottone.style.display = 'block';
                }
            } catch (errore) {
                bottone.style.display = 'block';
                console.error("Errore durante la richiesta dei permessi:", errore);
            }
        };
        OneSignal.Notifications.addEventListener("permissionChange", gestisciVisibilitaBottone);
    }
});
