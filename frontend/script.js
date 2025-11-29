// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements existants et NOUVEAUX pour les textes dynamiques
    const registeredCountEl = document.getElementById('registered-count');
    const maxUsersCountEl = document.getElementById('max-users-count');
    const remainingSpotsEl = document.getElementById('remaining-spots');
    const progressBarEl = document.getElementById('progress-bar');
    const emailListEl = document.getElementById('email-list');
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email-input');
    const submitButton = document.getElementById('submit-button');
    const messageFeedbackEl = document.getElementById('message-feedback');
    const registrationFormContainer = document.getElementById('registration-form-container');
    const limitReachedContainer = document.getElementById('limit-reached-container');
    
    // NOUVEAUX IDs pour les textes
    const dynamicTitleEl = document.getElementById('dynamic-title');
    const dynamicSubtitleEl = document.getElementById('dynamic-subtitle'); 
    const statusTitleEl = document.getElementById('status-title'); 
    const dynamicStatusTextEl = document.getElementById('dynamic-status-text'); 
    const dynamicRemainingTextEl = document.getElementById('dynamic-remaining-text'); 
    const listTitleEl = document.getElementById('list-title'); 
    const limitReachedTitleEl = document.getElementById('limit-reached-title'); 
    const limitReachedMessageEl = document.getElementById('limit-reached-message'); 
    
    // DOM Elements NOUVEAUX pour les champs optionnels
    const firstNameInput = document.getElementById('first-name-input');
    const lastNameInput = document.getElementById('last-name-input');
    const phoneInput = document.getElementById('phone-input');

    const API_BASE_URL = '/api';
    let MAX_USERS = 5; 
    let CURRENT_SETTINGS = {}; 

    /**
     * Masque l'email pour le rendre moins lisible publiquement.
     * Exemple : blessingfaustin1206@gmail.com devient ble******@gmail.com
     * @param {string} email 
     */
    const maskEmail = (email) => {
        const parts = email.split('@');
        if (parts.length !== 2) return email; 
        
        const username = parts[0];
        const domain = parts[1];
        
        if (username.length < 4) {
            return `${username.substring(0, 1)}**@${domain}`;
        }
        
        // On affiche les 3 premières lettres et les 2 dernières, puis masque le reste.
        const maskedUsername = `${username.substring(0, 3)}******${username.substring(username.length - 2)}`;
        
        return `${maskedUsername}@${domain}`;
    };

    /**
     * Adapte le formulaire et l'interface en fonction des settings de l'admin.
     */
    const adaptFormToSettings = () => {
        const s = CURRENT_SETTINGS;

        // 1. Mise à jour des textes
        if (s.title_text) dynamicTitleEl.textContent = s.title_text;
        if (s.subtitle_text) dynamicSubtitleEl.textContent = s.subtitle_text; 
        if (s.status_title) statusTitleEl.textContent = s.status_title; 
        if (s.list_title) listTitleEl.textContent = s.list_title; 
        if (s.limit_title) limitReachedTitleEl.textContent = s.limit_title; 
        if (s.limit_message) limitReachedMessageEl.textContent = s.limit_message; 
        
        if (s.button_text) submitButton.textContent = s.button_text;

        // 2. Affichage conditionnel des champs
        const toggleInput = (inputEl, requiredSetting) => {
            // Afficher ou masquer l'élément
            inputEl.classList.toggle('hidden', !requiredSetting);
            // Définir l'attribut required si le champ est demandé
            inputEl.required = requiredSetting; 
        };

        toggleInput(firstNameInput, s.require_first_name);
        toggleInput(lastNameInput, s.require_last_name);
        toggleInput(phoneInput, s.require_phone);
    };

    /**
     * Met à jour l'interface utilisateur avec les dernières données du backend.
     */
    const updateUI = (data) => {
        CURRENT_SETTINGS = data.settings || {};
        const registrations = data.registrations || [];
        
        // Mettre à jour la limite
        MAX_USERS = CURRENT_SETTINGS.max_users || 5;

        // Adapter le formulaire et les textes
        adaptFormToSettings(); 

        const count = registrations.length;
        const remaining = MAX_USERS - count;
        const progressPercentage = (count / MAX_USERS) * 100;

        // Remplacement des placeholders pour le texte de statut
        const statusText = (CURRENT_SETTINGS.status_text_tpl || '%count% / %max% utilisateurs enregistrés')
            .replace('%count%', count)
            .replace('%max%', MAX_USERS);
        
        const remainingText = (CURRENT_SETTINGS.remaining_text_tpl || 'Places restantes: %remaining%')
            .replace('%remaining%', Math.max(0, remaining));
            
        // Mise à jour des nouveaux éléments textuels
        // On réinsère les spans avec IDs pour que l'admin puisse modifier le texte sans casser la dynamique.
        dynamicStatusTextEl.innerHTML = statusText.replace(count, `<span id="registered-count">${count}</span>`).replace(MAX_USERS, `<span id="max-users-count">${MAX_USERS}</span>`);
        dynamicRemainingTextEl.innerHTML = remainingText.replace(Math.max(0, remaining), `<span id="remaining-spots">${Math.max(0, remaining)}</span>`);

        progressBarEl.style.width = `${progressPercentage}%`;

        // Gérer l'affichage du formulaire vs message "Complet"
        const isClosed = !CURRENT_SETTINGS.registration_open || count >= MAX_USERS;
        
        registrationFormContainer.classList.toggle('hidden', isClosed);
        limitReachedContainer.classList.toggle('hidden', !isClosed);
        
        // Affichage de la liste des emails masqués
        emailListEl.innerHTML = '';
        if (registrations.length > 0) {
            registrations.forEach(reg => {
                const li = document.createElement('li');
                li.textContent = maskEmail(reg.email); 
                emailListEl.appendChild(li);
            });
        } else {
            emailListEl.innerHTML = '<li>Personne n\'est encore inscrit. Sois le premier !</li>';
        }
        
        // Mise à jour de l'état du bouton si MAX_USERS atteint
        if (count >= MAX_USERS) {
            submitButton.disabled = true;
            submitButton.textContent = CURRENT_SETTINGS.button_text || 'Complet';
        } else if (CURRENT_SETTINGS.registration_open) {
            submitButton.disabled = false;
            submitButton.textContent = CURRENT_SETTINGS.button_text || 'Sécuriser ma place';
        }
    };

    /**
     * Récupère les emails et les paramètres du backend.
     */
    const fetchEmails = async () => {
        try {
            // Le endpoint getEmails renvoie settings et registrations
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            if (!response.ok) throw new Error('Erreur de connexion au serveur.');
            
            const data = await response.json();
            updateUI(data);

        } catch (error) {
            console.error('Error fetching data:', error);
            messageFeedbackEl.textContent = 'Erreur de connexion aux données. (Vérifiez la configuration Admin dans Supabase)';
            messageFeedbackEl.className = 'message error';
        }
    };
    
    /**
     * Gère l'envoi du formulaire d'email.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        if (!email) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Enregistrement...';
        messageFeedbackEl.textContent = '';
        messageFeedbackEl.className = 'message';

        // Construction du corps de la requête avec les champs actifs
        const bodyData = { email: email };
        // Ajouter les champs optionnels si nécessaires
        if (CURRENT_SETTINGS.require_first_name) bodyData.first_name = firstName;
        if (CURRENT_SETTINGS.require_last_name) bodyData.last_name = lastName;
        if (CURRENT_SETTINGS.require_phone) bodyData.phone_number = phone;

        try {
            const response = await fetch(`${API_BASE_URL}/addEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });

            const result = await response.json();

            if (!response.ok) {
                // Le backend renvoie le message d'erreur (limite atteinte, champ manquant, etc.)
                throw new Error(result.message || 'Une erreur inconnue est survenue.');
            }

            messageFeedbackEl.textContent = result.message;
            messageFeedbackEl.className = 'message success';
            
            // Réinitialisation des valeurs des inputs
            emailInput.value = '';
            firstNameInput.value = '';
            lastNameInput.value = '';
            phoneInput.value = '';
            
            // Recharger les données pour mettre à jour la liste et la barre de progression
            await fetchEmails();

        } catch (error) {
            messageFeedbackEl.textContent = error.message;
            messageFeedbackEl.className = 'message error';
        } finally {
            // Réactiver le bouton
            if (parseInt(document.getElementById('registered-count').textContent, 10) < MAX_USERS && CURRENT_SETTINGS.registration_open) {
                submitButton.disabled = false;
                submitButton.textContent = CURRENT_SETTINGS.button_text || 'Sécuriser ma place';
            }
        }
    };

    emailForm.addEventListener('submit', handleFormSubmit);
    fetchEmails(); // Chargement initial des données
});
