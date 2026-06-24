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
function salvaTodoOffline(nuovoTodo) {
    let todoOffline = JSON.parse(localStorage.getItem('todos_offline')) || [];
    todoOffline.push(nuovoTodo);
    localStorage.setItem('todos_offline', JSON.stringify(todoOffline));
    alert("Salvato in locale! Verrà inviato al server appena torna internet.");
}
// 1. SALVATAGGIO AUTOMATICO
function salvaInAutomatico() {
    if (isLoading) return;
    const attivi = [];
    const completati = [];
    document.querySelectorAll('#inputContainer .input-group').forEach(group => {
        const inputTesto = group.querySelector('.input');
        const inputData = group.querySelector('.date-input');
        if (inputTesto && !group.classList.contains('fade-out-delete') && !group.classList.contains('fade-out-complete')) {
            attivi.push({
                testo: inputTesto.value,
                data: inputData ? inputData.value : '',
                completato: false
            });
        }
    });
    const cronologiaContenitore = document.getElementById('cronologiaContainer');
    if (cronologiaContenitore) {
        cronologiaContenitore.querySelectorAll('.input-group').forEach(group => {
            const inputTesto = group.querySelector('.input');
            const inputData = group.querySelector('.date-input');
            if (inputTesto && !group.classList.contains('fade-out-delete')) {
                completati.push({
                    testo: inputTesto.value,
                    data: inputData ? inputData.value : '',
                    completato: true
                });
            }
        });
    }
    localStorage.setItem('todo_attivi', JSON.stringify(attivi));
    localStorage.setItem('todo_completati', JSON.stringify(completati));
    const tuttiGliElementi = [...attivi, ...completati];
    if (navigator.onLine) {
        isLoading = true;
        fetch('/invia-dati', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: MY_USER_ID,
                elementi: tuttiGliElementi
            })
        })
        .then(response => {
            if (!response.ok) throw new Error("Errore risposta server");
            console.log("🟢 Sincronizzato con il server!");
            localStorage.removeItem('ha_modifiche_offline');
        })
        .catch(err => {
            console.error("🔴 Errore fetch, salvo lo stato offline:", err);
            localStorage.setItem('ha_modifiche_offline', 'true');
        })
        .finally(() => {
            isLoading = false;
        });
    } else {
        console.log("📴 Offline: Dati salvati solo in locale. Sincronizzazione rimandata.");
        localStorage.setItem('ha_modifiche_offline', 'true');
    }
}
// 2. FUNZIONE GENERAZIONE INPUT
function addInput(testoIniziale = '', spuntatoIniziale = false, dataIniziale = ''){
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('input-group');
    inputGroup.style.display = "flex";
    inputGroup.style.justifyContent = "center";
    inputGroup.style.alignItems = "center";
    inputGroup.style.width = "100%";
    inputGroup.style.marginLeft = "0";
    inputGroup.style.marginRight = "0";
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.classList.add('date-input');
    dateInput.style.textAlign = "center";
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
    newInput.placeholder = 'Write a task...';
    newInput.classList.add('input');
    newInput.style.textAlign = "center";
    newInput.value = testoIniziale;
    newInput.oninput = function() {
        salvaInAutomatico();
    }
    const complete = document.createElement('button');
    complete.textContent = '✓';
    complete.classList.add('check');
    function creaStrutturaCronologia() {
    let cronologiaHeaderBox = document.getElementById('cronologiaHeaderBox');
    let cronologiaTitolo = document.getElementById('titoloCronologia');
    if (!cronologiaHeaderBox) {
        cronologiaHeaderBox = document.createElement('div');
        cronologiaHeaderBox.id = 'cronologiaHeaderBox';
        cronologiaHeaderBox.style.display = "flex";
        cronologiaHeaderBox.style.flexDirection = "column";
        cronologiaHeaderBox.style.alignItems = "center";
        cronologiaHeaderBox.style.width = "100%";
        cronologiaHeaderBox.style.marginTop = "30px";
        cronologiaHeaderBox.style.marginBottom = "15px";
        cronologiaTitolo = document.createElement('h3');
        cronologiaTitolo.id = 'titoloCronologia';
        cronologiaTitolo.textContent = 'HISTORY:';
        cronologiaTitolo.style.margin = "0 0 10px 0";
        cronologiaTitolo.style.textAlign = "center";   
        const btnSvuota = document.createElement('button');
        btnSvuota.id = 'btnSvuotaCronologia';
        btnSvuota.textContent = 'Delete History';
        btnSvuota.style.backgroundColor = '#dc3545';
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
                    cronologiaHeaderBox.remove();
                    salvaInAutomatico();
                }, 500);
            } else {
                cronologiaHeaderBox.remove();
                salvaInAutomatico();
            }
        };
        cronologiaHeaderBox.appendChild(cronologiaTitolo);
        cronologiaHeaderBox.appendChild(btnSvuota);
        document.getElementById('inputContainer').after(cronologiaHeaderBox);
    }
        let cronologia = document.getElementById('cronologiaContainer');
    if (!cronologia) {
        cronologia = document.createElement('div');
        cronologia.id = 'cronologiaContainer';
        cronologia.style.setProperty('display', 'flex', 'important');
        cronologia.style.setProperty('flex-direction', 'column', 'important');
        cronologia.style.setProperty('align-items', 'center', 'important');
        cronologia.style.setProperty('justify-content', 'center', 'important');
        cronologia.style.setProperty('width', '100%', 'important');
        cronologia.style.setProperty('margin', '0 auto', 'important');
        cronologia.style.setProperty('padding', '0', 'important');
        cronologiaHeaderBox.after(cronologia);
    }
    return cronologia;
}
    function aggiungiCestinoSingolo() {
        if (inputGroup.querySelector('.delete-single-history')) return;
        const trashBtn = document.createElement('button');
        trashBtn.textContent = '🗑️';
        trashBtn.style.marginLeft = "10px";
        trashBtn.style.marginTop = "0px";
        trashBtn.classList.add('delete-single-history');
        trashBtn.style.backgroundColor = '#dc3545';
        trashBtn.onclick = function() {
            newInput.style.backgroundColor = '#dc3545';
            newInput.style.borderColor = '#dc3545';
            dateInput.style.setProperty('background-color', '#dc3545', 'important');
            dateInput.style.setProperty('border-color', '#dc3545', 'important'); 
            inputGroup.classList.add('fade-out-delete');
            setTimeout(() => {
                inputGroup.remove();
                const cronologia = document.getElementById('cronologiaContainer');
                const cronologiaHeaderBox = document.getElementById('cronologiaHeaderBox');
                if (cronologia && cronologia.children.length === 0) {
                    cronologia.remove();
                    if (cronologiaHeaderBox) cronologiaHeaderBox.remove();
                }
                salvaInAutomatico();
            }, 500);
        };
        inputGroup.appendChild(trashBtn);
    }
    function applicaStileStato(isComplete, eseguiTransizione = true) {
        if(isComplete){
            complete.dataset.complete = 'true';
            complete.style.backgroundColor = '#1e7e34';
            newInput.style.backgroundColor = '#1e7e34';
            newInput.style.borderColor = '#1e7e34';
            newInput.style.color = '#ffffff';
            dateInput.style.setProperty('background-color', '#1e7e34', 'important');
            dateInput.style.setProperty('border-color', '#1e7e34', 'important');
            dateInput.style.setProperty('color', '#ffffff', 'important');
            newInput.disabled = true;
            dateInput.disabled = true;
            if (eseguiTransizione) {
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
            }
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
    complete.onclick = function(){
        const nuovoStato = complete.dataset.complete !== 'true';
        applicaStileStato(nuovoStato, true);
        salvaInAutomatico();
    };
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
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
    if (spuntatoIniziale) {
        applicaStileStato(true, false);
        aggiungiCestinoSingolo();
        const cronologia = creaStrutturaCronologia();
        cronologia.appendChild(inputGroup);
    } else {
        applicaStileStato(false, false);
        inputGroup.appendChild(complete);
        inputGroup.appendChild(deleteBtn);
        const inputContainer = document.getElementById('inputContainer');
        if (inputContainer) {
            inputContainer.style.display = "flex";
            inputContainer.style.flexDirection = "column";
            inputContainer.style.alignItems = "center";
        }
            inputContainer.appendChild(inputGroup);
        }
        }
    // 3. RECUPERO DATI DALLO STORICO
    function caricaDati() {
        isLoading = true;
        const attivi = JSON.parse(localStorage.getItem('todo_attivi')) || [];
        const completati = JSON.parse(localStorage.getItem('todo_completati')) || [];
        document.getElementById('inputContainer').innerHTML = '';
        const cronologiaContenitore = document.getElementById('cronologiaContainer');
        if (cronologiaContenitore) cronologiaContenitore.innerHTML = '';
        attivi.forEach(item => {
            if (item.testo.trim() !== '') {
                addInput(item.testo, false, item.data);
            }
        });
        completati.forEach(item => {
            if (item.testo.trim() !== '') {
                addInput(item.testo, true, item.data);
            }
        });
        isLoading = false;
    }
    // 4. AVVIO AUTOMATICO
    document.addEventListener("DOMContentLoaded", () => {
        caricaDati();
        document.getElementById('addInput').addEventListener('click', () => addInput());
    });
window.addEventListener('online', () => {
    console.log("📶 Connessione ripristinata! Controllo sincronizzazione...");
    const haModifiche = localStorage.getItem('ha_modifiche_offline');
    if (haModifiche === 'true') {
        console.log("🔄 Trovate modifiche offline. Sincronizzo con il server...");
        const attivi = JSON.parse(localStorage.getItem('todo_attivi')) || [];
        const completati = JSON.parse(localStorage.getItem('todo_completati')) || [];
        const tuttiGliElementi = [...attivi, ...completati];
        isLoading = true;
        fetch('/invia-dati', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: MY_USER_ID,
                elementi: tuttiGliElementi
            })
        })
        .then(response => {
            if (!response.ok) throw new Error();
            console.log("🟢 Database MongoDB aggiornato con successo dopo il rientro online!");
            localStorage.removeItem('ha_modifiche_offline');
        })
        .catch(err => {
            console.error("🔴 Tentativo di sincronizzazione fallito, riproverò al prossimo ritorno online.", err);
        })
        .finally(() => {
            isLoading = false;
        });
    } else {
        console.log("✅ Nessuna modifica offline da sincronizzare.");
    }
});
window.addEventListener('offline', () => {
    console.log("📴 Sei offline. Le modifiche verranno salvate localmente.");
});
// 5. CARICAMENTO INIZIALE DEI DATI (Gestione Offline/Online)
function caricaDatiIniziali() {
    if (!navigator.onLine) {
        console.log("📴 Offline all'avvio: Carico i dati dal localStorage...");
        mostraDatiInInterfaccia();
        return;
    }
    isLoading = true;
    fetch('/prendi-dati', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: MY_USER_ID })
    })
    .then(response => {
        if (!response.ok) throw new Error("Errore risposta server");
        return response.json();
    })
    .then(data => {
        if (data && data.elementi) {
            console.log("🟢 Dati scaricati con successo da MongoDB!");
            const attivi = data.elementi.filter(el => !el.completato);
            const completati = data.elementi.filter(el => el.completato);
            localStorage.setItem('todo_attivi', JSON.stringify(attivi));
            localStorage.setItem('todo_completati', JSON.stringify(completati));
            mostraDatiInInterfaccia();
        }
    })
    .catch(err => {
        console.error("🔴 Impossibile contattare il server, ripiego sul localStorage:", err);
        mostraDatiInInterfaccia();
    })
    .finally(() => {
        isLoading = false;
    });
}
function mostraDatiInInterfaccia() {
    document.getElementById('inputContainer').innerHTML = '';
    const cronologia = document.getElementById('cronologiaContainer');
    if (cronologia) cronologia.innerHTML = '';
    const attivi = JSON.parse(localStorage.getItem('todo_attivi')) || [];
    const completati = JSON.parse(localStorage.getItem('todo_completati')) || [];
    attivi.forEach(todo => {
        addInput(todo.testo, false, todo.data);
    });
    completati.forEach(todo => {
        addInput(todo.testo, true, todo.data);
    });
}
document.addEventListener('DOMContentLoaded', caricaDatiIniziali);
// 6. ASCOLTATORE DI CONNESSIONE IN TEMPO REALE
window.addEventListener('online', () => {
    console.log("📶 Connessione ripristinata! Controllo sincronizzazione...");
    const haModifiche = localStorage.getItem('ha_modifiche_offline');
    if (haModifiche === 'true') {
        console.log("🔄 Trovate modifiche offline. Sincronizzo con il server...");
        const attivi = JSON.parse(localStorage.getItem('todo_attivi')) || [];
        const completati = JSON.parse(localStorage.getItem('todo_completati')) || [];
        const tuttiGliElementi = [...attivi, ...completati];
        isLoading = true;
        fetch('/invia-dati', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: MY_USER_ID, elementi: tuttiGliElementi })
        })
        .then(response => {
            if (!response.ok) throw new Error();
            console.log("🟢 Database MongoDB allineato con successo!");
            localStorage.removeItem('ha_modifiche_offline');
        })
        .catch(err => console.error("🔴 Sincronizzazione fallita, riproverò più tardi.", err))
        .finally(() => isLoading = false);
    }
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log("🚀 Service Worker attivo per l'offline!"))
      .catch(err => console.error("❌ Errore SW:", err));
  });
}
