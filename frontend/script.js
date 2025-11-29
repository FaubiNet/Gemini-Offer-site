// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
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
    
    // NOUVEAU: Élément pour le message de liste vide
    const emptyListMessageEl = document.getElementById('empty-list-message'); 
    
    // IDs pour les textes dynamiques
    const dynamicTitleEl = document.getElementById('dynamic-title');
    const statusTitleEl = document.getElementById('status-title'); 
    const dynamicStatusTextEl = document.getElementById('dynamic-status-text'); 
    const dynamicRemainingTextEl = document.getElementById('dynamic-remaining-text'); 
    const limitReachedTitleEl = document.getElementById('limit-reached-title');
    const limitReachedMessageEl = document.getElementById('limit-reached-message');
    
    // Inputs optionnels
    const firstNameInput = document.getElementById('first-name-input');
    const lastNameInput = document.getElementById('last-name-input');
    const phoneInput = document.getElementById('phone-input');
    
    let MAX_USERS = 5;
    let CURRENT_SETTINGS = {}; 
    const API_BASE_URL = '/api';

    // --- Fonctions de mise à jour de l'UI ---

    const updateUI = (settings, registrations) => {
        const count = registrations.length;
        // S'assurer que MAX_USERS est un nombre valide
        MAX_USERS = parseInt(settings.max_users) || 5; 
        const remaining = Math.max(0, MAX_USERS - count);
        const percentage = (MAX_USERS > 0) ? (count / MAX_USERS) * 100 : 0; // Éviter la division par zéro

        // 1. Mettre à jour les textes dynamiques
        dynamicTitleEl.textContent = settings.title_text || 'Gemini Enterprise';
        submitButton.textContent = settings.button_text || 'Sécuriser ma place';
        
        statusTitleEl.textContent = settings.status_title || 'Accès Anticipé – Vague 1';
        dynamicStatusTextEl.textContent = settings.status_text || 'places restantes';
        // Ajuster "Reste/Restent"
        dynamicRemainingTextEl.textContent = remaining <= 1 ? 'Reste' : 'Restent'; 
        
        limitReachedTitleEl.textContent = settings.limit_title || 'L’offre est terminée !';
        limitReachedMessageEl.textContent = settings.limit_message || 'Retourne sur la chaîne Hackers Academy X...';

        // 2. Mettre à jour la barre et les compteurs
        registeredCountEl.textContent = count;
        maxUsersCountEl.textContent = MAX_USERS;
        remainingSpotsEl.textContent = remaining;
        progressBarEl.style.width = `${percentage}%`;

        // 3. Afficher/Masquer les champs requis
        firstNameInput.classList.toggle('hidden', !settings.require_first_name);
        lastNameInput.classList.toggle('hidden', !settings.require_last_name);
        phoneInput.classList.toggle('hidden', !settings.require_phone);
        
        // Mettre à jour les attributs 'required' pour la validation du navigateur
        firstNameInput.required = settings.require_first_name;
        lastNameInput.required = settings.require_last_name;
        phoneInput.required = settings.require_phone;

        // 4. Afficher/Masquer la forme ou le message de limite
        if (count >= MAX_USERS || !settings.registration_open) {
            registrationFormContainer.classList.add('hidden');
            limitReachedContainer.classList.remove('hidden');
        } else {
            registrationFormContainer.classList.remove('hidden');
            limitReachedContainer.classList.add('hidden');
            submitButton.disabled = false;
        }

        // 5. Afficher la liste des inscrits
        emailListEl.innerHTML = '';
        if (count === 0) {
            // Afficher le message d'absence d'inscrits
            const li = document.createElement('li');
            li.id = 'empty-list-message';
            li.className = 'empty-message';
            li.textContent = 'Personne n\'est inscrit. Soyez le premier !';
            emailListEl.appendChild(li);
        } else {
            // Afficher les inscrits
            registrations.forEach(reg => {
                const li = document.createElement('li');
                li.textContent = reg.email;
                emailListEl.appendChild(li);
            });
        }
    };

    // --- Chargement des données ---

    const fetchEmails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            if (!response.ok) throw new Error('Erreur de chargement des données.');
            
            const data = await response.json();
            CURRENT_SETTINGS = data.settings;
            
            updateUI(data.settings, data.registrations);

        } catch (error) {
            console.error('Erreur fetchEmails:', error);
            messageFeedbackEl.textContent = 'Erreur: Impossible de charger les données de la campagne.';
            messageFeedbackEl.className = 'message error';
            
            // Initialiser les comptes même en cas d'erreur de chargement pour éviter l'absence de nombres
            maxUsersCountEl.textContent = MAX_USERS; 
            registeredCountEl.textContent = 0;
            remainingSpotsEl.textContent = MAX_USERS;
            
            // Afficher le message de liste vide
            emailListEl.innerHTML = '<li id="empty-list-message" class="empty-message">Impossible de charger la liste.</li>';
        }
    };

    // --- Soumission du formulaire ---

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim().toLowerCase();
        const first_name = firstNameInput.value.trim();
        const last_name = lastNameInput.value.trim();
        const phone_number = phoneInput.value.trim();
        
        if (!email) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Envoi...';
        messageFeedbackEl.textContent = '';
        messageFeedbackEl.className = 'message';

        const bodyData = { email };
        if (CURRENT_SETTINGS.require_first_name) bodyData.first_name = first_name;
        if (CURRENT_SETTINGS.require_last_name) bodyData.last_name = last_name;
        if (CURRENT_SETTINGS.require_phone) bodyData.phone_number = phone_number;

        try {
            const response = await fetch(`${API_BASE_URL}/addEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Une erreur inconnue est survenue.');
            }

            messageFeedbackEl.textContent = result.message;
            messageFeedbackEl.className = 'message success';
            
            emailInput.value = '';
            firstNameInput.value = '';
            lastNameInput.value = '';
            phoneInput.value = '';
            
            await fetchEmails();

        } catch (error) {
            messageFeedbackEl.textContent = error.message;
            messageFeedbackEl.className = 'message error';
        } finally {
            if (parseInt(registeredCountEl.textContent, 10) < MAX_USERS && CURRENT_SETTINGS.registration_open) {
                submitButton.disabled = false;
                submitButton.textContent = CURRENT_SETTINGS.button_text || 'Sécuriser ma place';
            }
        }
    };

    emailForm.addEventListener('submit', handleFormSubmit);
    fetchEmails();
});
