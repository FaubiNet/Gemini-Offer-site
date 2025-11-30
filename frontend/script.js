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
    
    // Textes dynamiques
    const dynamicTitleEl = document.getElementById('dynamic-title');
    const dynamicSubtitleEl = document.getElementById('dynamic-subtitle');
    const statusTitleEl = document.getElementById('status-title'); 
    const dynamicStatusTextEl = document.getElementById('dynamic-status-text'); 
    const dynamicRemainingTextEl = document.getElementById('dynamic-remaining-text'); 
    const listTitleEl = document.getElementById('list-title');
    const limitReachedTitleEl = document.getElementById('limit-reached-title');
    const limitReachedMessageEl = document.getElementById('limit-reached-message');
    
    // Champs conditionnels
    const firstNameInput = document.getElementById('first-name-input');
    const lastNameInput = document.getElementById('last-name-input');
    const phoneInput = document.getElementById('phone-input');
    
    let MAX_USERS = 5;
    let CURRENT_SETTINGS = {}; 
    const API_BASE_URL = '/api';

    // --- Masquage d'email pour la liste publique ---
    const maskEmail = (email) => {
        if (!email || typeof email !== 'string') return '';
        const parts = email.split('@');
        if (parts.length !== 2) return email;

        const [localPart, domain] = parts;
        const maskedLocalPart = localPart.length > 3 
            ? localPart.substring(0, 3) + '****' + localPart.substring(localPart.length - 2)
            : '****';
        return `${maskedLocalPart}@${domain}`;
    };

    // --- Remplacement des placeholders dans les textes DB ---
    // %count%  => nombre d'inscrits
    // %max%    => max_users
    // %remaining% => places restantes
    const applyPlaceholders = (text, { count, max, remaining }) => {
        if (!text) return '';
        return text
            .replace(/%count%/g, count)
            .replace(/%max%/g, max)
            .replace(/%remaining%/g, remaining);
    };

    // --- Mise à jour complète de l'UI ---
    const updateUI = (settings, registrations) => {
        const allRegistrations = Array.isArray(registrations) ? registrations : [];
        // On NE GARDE QUE les emails NON supprimés (pas dans la corbeille)
        const activeRegistrations = allRegistrations.filter(reg => !reg.is_deleted);

        const count = activeRegistrations.length;
        MAX_USERS = parseInt(settings.max_users, 10) || 5; 
        const remaining = Math.max(0, MAX_USERS - count);
        const percentage = (MAX_USERS > 0) ? (count / MAX_USERS) * 100 : 0;

        // Titres principaux
        dynamicTitleEl.textContent = settings.title_text || 'Gemini Enterprise';
        dynamicSubtitleEl.textContent = settings.subtitle_text || 'Hackers Academy X';
        submitButton.textContent = settings.button_text || 'Sécuriser ma place';
        statusTitleEl.textContent = settings.status_title || 'Accès Anticipé – Vague 1';

        // Textes dynamiques avec placeholders venant de la DB
        const statusTpl = settings.status_text_tpl || '';
        const remainingTpl = settings.remaining_text_tpl || '';

        const replacedStatusText = applyPlaceholders(statusTpl, {
            count,
            max: MAX_USERS,
            remaining,
        });

        const replacedRemainingText = applyPlaceholders(remainingTpl, {
            count,
            max: MAX_USERS,
            remaining,
        });

        dynamicStatusTextEl.textContent = replacedStatusText;
        dynamicRemainingTextEl.textContent = replacedRemainingText;

        listTitleEl.textContent = settings.list_title || 'Liste des inscrits :';
        limitReachedTitleEl.textContent = settings.limit_title || 'L’offre est terminée !';
        limitReachedMessageEl.textContent = settings.limit_message || 'Retourne sur la chaîne Hackers Academy X...';

        // Ligne : "X / Y places prises | Places restantes : Z"
        registeredCountEl.textContent = count;
        maxUsersCountEl.textContent = MAX_USERS;
        remainingSpotsEl.textContent = remaining;
        progressBarEl.style.width = `${percentage}%`;

        // Champs conditionnels
        firstNameInput.classList.toggle('hidden', !settings.require_first_name);
        lastNameInput.classList.toggle('hidden', !settings.require_last_name);
        phoneInput.classList.toggle('hidden', !settings.require_phone);
        
        firstNameInput.required = !!settings.require_first_name;
        lastNameInput.required = !!settings.require_last_name;
        phoneInput.required = !!settings.require_phone;

        // Si plein ou fermé, on masque le formulaire
        if (count >= MAX_USERS || !settings.registration_open) {
            registrationFormContainer.classList.add('hidden');
            limitReachedContainer.classList.remove('hidden');
        } else {
            registrationFormContainer.classList.remove('hidden');
            limitReachedContainer.classList.add('hidden');
            submitButton.disabled = false;
        }

        // Liste des inscrits (masqués)
        emailListEl.innerHTML = '';
        if (count === 0) {
            const li = document.createElement('li');
            li.id = 'empty-list-message';
            li.className = 'empty-message';
            li.textContent = "Personne n'est inscrit. Soyez le premier !";
            emailListEl.appendChild(li);
        } else {
            activeRegistrations.forEach(reg => {
                const li = document.createElement('li');
                li.textContent = maskEmail(reg.email);
                emailListEl.appendChild(li);
            });
        }
    };

    // --- Récupération des données depuis l'API ---
    const fetchEmails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`); 
            if (!response.ok) throw new Error('Erreur de chargement des données.');
            
            const data = await response.json();
            CURRENT_SETTINGS = data.settings || {};
            updateUI(data.settings, data.registrations || []); 

        } catch (error) {
            console.error('Erreur fetchEmails:', error);
            messageFeedbackEl.textContent = 'Erreur: Impossible de charger les données de la campagne.';
            messageFeedbackEl.className = 'message error';
            
            maxUsersCountEl.textContent = MAX_USERS; 
            registeredCountEl.textContent = 0;
            remainingSpotsEl.textContent = MAX_USERS;
            
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
            // On ne réactive que si ce n'est pas plein et que les inscriptions sont ouvertes
            if (parseInt(registeredCountEl.textContent, 10) < MAX_USERS && CURRENT_SETTINGS.registration_open) {
                submitButton.disabled = false;
                submitButton.textContent = CURRENT_SETTINGS.button_text || 'Sécuriser ma place';
            }
        }
    };

    // --- Listeners + init ---
    emailForm.addEventListener('submit', handleFormSubmit);
    fetchEmails();
});