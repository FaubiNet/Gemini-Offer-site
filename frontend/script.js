// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements existants
    const registeredCountEl = document.getElementById('registered-count');
    const maxUsersCountEl = document.getElementById('max-users-count'); // NOUVEAU
    const remainingSpotsEl = document.getElementById('remaining-spots');
    const progressBarEl = document.getElementById('progress-bar');
    const emailListEl = document.getElementById('email-list');
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email-input');
    const submitButton = document.getElementById('submit-button');
    const messageFeedbackEl = document.getElementById('message-feedback');
    const registrationFormContainer = document.getElementById('registration-form-container');
    const limitReachedContainer = document.getElementById('limit-reached-container');
    const dynamicTitleEl = document.getElementById('dynamic-title'); // NOUVEAU
    
    // DOM Elements NOUVEAUX pour les champs optionnels
    const firstNameInput = document.getElementById('first-name-input');
    const lastNameInput = document.getElementById('last-name-input');
    const phoneInput = document.getElementById('phone-input');

    const API_BASE_URL = '/api';
    let MAX_USERS = 5; // Valeur par défaut
    let CURRENT_SETTINGS = {}; // Stocke les settings de l'admin

    /**
     * Adapte le formulaire et l'interface en fonction des settings de l'admin.
     */
    const adaptFormToSettings = () => {
        const s = CURRENT_SETTINGS;

        // 1. Mise à jour des textes
        if (s.title_text) dynamicTitleEl.textContent = s.title_text;
        if (s.button_text) submitButton.textContent = s.button_text;

        // 2. Affichage conditionnel des champs
        const toggleInput = (inputEl, requiredSetting) => {
            inputEl.classList.toggle('hidden', !requiredSetting);
            // On peut ajouter l'attribut required si le champ est actif
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
        // Le format a changé: data.settings et data.registrations
        CURRENT_SETTINGS = data.settings;
        const registrations = data.registrations || [];
        
        // Mettre à jour la limite
        MAX_USERS = CURRENT_SETTINGS.max_users || 5;

        // Adapter le formulaire et les textes
        adaptFormToSettings(); 

        const count = registrations.length;
        const remaining = MAX_USERS - count;
        const progressPercentage = (count / MAX_USERS) * 100;

        // Mise à jour des stats
        registeredCountEl.textContent = count;
        maxUsersCountEl.textContent = MAX_USERS; // Afficher la limite dynamique
        remainingSpotsEl.textContent = Math.max(0, remaining);
        progressBarEl.style.width = `${progressPercentage}%`;

        // Gérer l'affichage du formulaire vs message "Complet"
        const isClosed = !CURRENT_SETTINGS.registration_open || count >= MAX_USERS;
        
        registrationFormContainer.classList.toggle('hidden', isClosed);
        limitReachedContainer.classList.toggle('hidden', !isClosed);
        
        // Affichage de la liste des emails 
        emailListEl.innerHTML = '';
        if (registrations.length > 0) {
            registrations.forEach(reg => {
                const li = document.createElement('li');
                // On affiche juste l'email (ou l'info principale) sur la page utilisateur
                li.textContent = reg.email; 
                emailListEl.appendChild(li);
            });
        } else {
            emailListEl.innerHTML = '<li>Personne n\'est encore inscrit. Sois le premier !</li>';
        }
        
        // Mise à jour de l'état du bouton si MAX_USERS atteint
        if (count >= MAX_USERS) {
            submitButton.disabled = true;
            submitButton.textContent = 'Complet';
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
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            if (!response.ok) throw new Error('Erreur de connexion au serveur.');
            
            const data = await response.json();
            updateUI(data);

        } catch (error) {
            console.error('Error fetching data:', error);
            messageFeedbackEl.textContent = 'Erreur de connexion aux données.';
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
            if (parseInt(registeredCountEl.textContent, 10) < MAX_USERS && CURRENT_SETTINGS.registration_open) {
                submitButton.disabled = false;
                submitButton.textContent = CURRENT_SETTINGS.button_text || 'Sécuriser ma place';
            }
        }
    };

    emailForm.addEventListener('submit', handleFormSubmit);
    fetchEmails(); // Chargement initial des données
});
