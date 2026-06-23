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
// 1. SALVATAGGIO AUTOMATICO (Incluso campo Data)
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
    newInput.placeholder = 'Scrivi un task...';
    newInput.classList.add('input');
    newInput.value = testoIniziale;
    newInput.oninput = function() {
        salvaInAutomatico();
    }
    const complete = document.createElement('button');
    complete.textContent = '✓';
    complete.classList.add('check');  
    function creaStrutturaCronologia() {
        let cronologiaTitolo = document.getElementById('titoloCronologia');
        if (!cronologiaTitolo) {
            cronologiaTitolo = document.createElement('h3');
            cronologiaTitolo.id = 'titoloCronologia';
            cronologiaTitolo.textContent = 'CRONOLOGIA: ';
            cronologiaTitolo.style.marginBottom = "5px"; 
            cronologiaTitolo.style.marginTop = "20px";
            const btnSvuota = document.createElement('button');
            btnSvuota.textContent = 'ELIMINA CRONOLOGIA';
            btnSvuota.style.backgroundColor = '#dc3545';
            btnSvuota.style.fontSize = '12px';
            btnSvuota.style.marginLeft = '15px';
            btnSvuota.style.padding = '4px 8px';
            btnSvuota.onclick = function() {
                const cronologia = document.getElementById('cronologiaContainer');
                if (cronologia) {
                    const elementi = cronologia.querySelectorAll('.input-group');
                    elementi.forEach(elemento => {
                        const inputTesto = elemento.querySelector('.input');
                        const inputData = elemento.querySelector('.date-input');
                        if (inputTesto) {
                            inputTesto.style.backgroundColor = '#dc3545';
                            inputTesto.style.borderColor = '#dc3545';
                        }
                        if (inputData) {
                            inputData.style.setProperty('background-color', '#dc3545', 'important');
                            inputData.style.setProperty('border-color', '#dc3545', 'important');
                        }
                        elemento.classList.add('fade-out-delete');
                    });
                    setTimeout(() => {
                        cronologia.remove();
                        cronologiaTitolo.remove();
                        salvaInAutomatico();
                    }, 500);
                } else {
                    cronologiaTitolo.remove();
                    salvaInAutomatico();
                }
            };
            cronologiaTitolo.appendChild(btnSvuota);
            document.getElementById('inputContainer').after(cronologiaTitolo);
        }
        let cronologia = document.getElementById('cronologiaContainer');
        if (!cronologia) {
            cronologia = document.createElement('div');
            cronologia.id = 'cronologiaContainer';
            cronologiaTitolo.after(cronologia);
        }
        return cronologia;
    }
    function aggiungiCestinoSingolo() {
        const trashBtn = document.createElement('button');
        trashBtn.textContent = '🗑️';
        trashBtn.style.marginTop = "5px";
        trashBtn.classList.add('delete-single-history');
        trashBtn.style.backgroundColor = '#dc3545';
        trashBtn.style.padding = '8px 12px';
        if (window.innerWidth > 500) {
            trashBtn.style.marginLeft = "10px";
        }
        trashBtn.onclick = function() {
            newInput.style.backgroundColor = '#dc3545';
            newInput.style.borderColor = '#dc3545';
            dateInput.style.setProperty('background-color', '#dc3545', 'important');
            dateInput.style.setProperty('border-color', '#dc3545', 'important'); 
            inputGroup.classList.add('fade-out-delete');
            setTimeout(() => {
                inputGroup.remove();
                const cronologia = document.getElementById('cronologiaContainer');
                const cronologiaTitolo = document.getElementById('titoloCronologia');
                if (cronologia && cronologia.children.length === 0) {
                    cronologia.remove();
                    if (cronologiaTitolo) cronologiaTitolo.remove();
                }
                salvaInAutomatico();
            }, 500);
        };
        inputGroup.appendChild(trashBtn);
    }
    function applicaStileStato(isComplete) {
        if(isComplete){
            complete.dataset.complete = 'true';
            complete.style.backgroundColor = '#1e7e34';
            newInput.style.backgroundColor = '#28a745';
            newInput.style.borderColor = '#28a745';
            newInput.style.color = '#ffffff';
            dateInput.style.setProperty('background-color', '#1e7e34', 'important');
            dateInput.style.setProperty('border-color', '#1e7e34', 'important');
            dateInput.style.setProperty('color', '#ffffff', 'important');
            newInput.disabled = true;
            dateInput.disabled = true;
            inputGroup.classList.add('fade-out-complete');
            setTimeout(() => {
                if (newInput.value.trim() === '') {
                    inputGroup.remove();
                    salvaInAutomatico();
                    return; 
                }
                const cronologia = creaStrutturaCronologia();
                complete.remove();
                deleteBtn.remove();
                aggiungiCestinoSingolo();
                inputGroup.classList.remove('fade-out-complete'); 
                cronologia.appendChild(inputGroup); 
                salvaInAutomatico();
            }, 500);
        } else {
            complete.dataset.complete = 'false';
            complete.style.backgroundColor = '#28a745';
            newInput.style.backgroundColor = '#ffffff';
            newInput.style.borderColor = '#ffffff';
            newInput.style.color = '#000000';
            dateInput.style.removeProperty('background-color');
            dateInput.style.removeProperty('border-color');
            dateInput.style.removeProperty('color');
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
        newInput.style.backgroundColor = '#dc3545';
        newInput.style.borderColor = '#dc3545';
        newInput.style.color = '#ffffff';
        dateInput.style.setProperty('background-color', '#dc3545', 'important');
        dateInput.style.setProperty('border-color', '#dc3545', 'important');
        dateInput.style.setProperty('color', '#ffffff', 'important');
        newInput.disabled = true;
        dateInput.disabled = true;
        inputGroup.classList.add('fade-out-delete');
        setTimeout(() => {
            inputGroup.remove();
            salvaInAutomatico();
        }, 500);
    };
    inputGroup.appendChild(dateInput);
    inputGroup.appendChild(newInput);
    inputGroup.appendChild(complete);
    inputGroup.appendChild(deleteBtn);
    if (spuntatoIniziale && testoIniziale.trim() !== '') {
        complete.remove();
        deleteBtn.remove();
        aggiungiCestinoSingolo();
        const cronologia = creaStrutturaCronologia();
        cronologia.appendChild(inputGroup);
    } else {
        document.getElementById('inputContainer').appendChild(inputGroup);
    }
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
// 4. GESTIONE DI ONESIGNAL
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
                    alert("🟢 Notifiche attivate con successo! Riceverai i promemoria.");
                }
                gestisciVisibilitaBottone();
            } catch (err) {
                console.error("Errore attivazione notifiche:", err);
                bottone.style.display = 'block';
            }
        };
    }
});
