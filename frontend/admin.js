// frontend/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // Éléments du formulaire de settings
    const titleInput = document.getElementById('admin-title-text');
    const subtitleInput = document.getElementById('admin-subtitle-text'); 
    const buttonInput = document.getElementById('admin-button-text');
    const maxUsersInput = document.getElementById('admin-max-users');
    const regOpenInput = document.getElementById('admin-registration-open');
    const reqFNameInput = document.getElementById('admin-require-first-name');
    const reqLNameInput = document.getElementById('admin-require-last-name');
    const reqPhoneInput = document.getElementById('admin-require-phone');
    
    // NOUVEAUX Champs de texte
    const statusTitleInput = document.getElementById('admin-status-title'); 
    const statusTextTplInput = document.getElementById('admin-status-text-tpl'); 
    const remainingTextTplInput = document.getElementById('admin-remaining-text-tpl'); 
    const listTitleInput = document.getElementById('admin-list-title'); 
    const limitTitleInput = document.getElementById('admin-limit-title'); 
    const limitMessageInput = document.getElementById('admin-limit-message'); 
    const passwordInput = document.getElementById('admin-password-input'); // Nouveau champ pour changer le mot de passe

    const saveButton = document.getElementById('save-settings-btn');
    const feedbackEl = document.getElementById('admin-message-feedback');

    // Éléments de la liste des inscrits
    const regListBody = document.getElementById('admin-registrations-list');
    const adminRegCount = document.getElementById('admin-registered-count');
    const adminMaxCount = document.getElementById('admin-max-count');
    const thFName = document.getElementById('th-first-name');
    const thLName = document.getElementById('th-last-name');
    const thPhone = document.getElementById('th-phone');
    
    // Éléments pour l'authentification
    const loginForm = document.getElementById('admin-login-form');
    const loginContainer = document.getElementById('admin-login-container');
    const dashboardContainer = document.getElementById('admin-dashboard-container');
    const loginPasswordInput = document.getElementById('login-password');
    const loginFeedbackEl = document.getElementById('login-message-feedback');
    const PASSWORD_COOKIE_NAME = 'admin_auth'; // Nom du cookie pour l'authentification

    const API_BASE_URL = '/api';

    // --- FONCTIONS DE GESTION DES COOKIES ---
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const setCookie = (name, value, days) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        // Utiliser SameSite=Lax ou Strict pour la sécurité
        document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax"; 
    };

    // --- FONCTION DE CHARGEMENT DES DONNÉES ET AFFICHAGE ---
    
    /**
     * Lit les settings et les inscrits du backend et met à jour l'admin UI.
     * Cette fonction est protégée par un cookie d'authentification dans le backend.
     */
    const loadAdminData = async () => {
        try {
            // Le backend vérifie le cookie dans l'en-tête de la requête
            const response = await fetch(`${API_BASE_URL}/getSettings`); 
            
            if (response.status === 403) {
                // Si l'accès est refusé (cookie invalide/expiré), on force la déconnexion
                setCookie(PASSWORD_COOKIE_NAME, '', -1); // Supprimer le cookie
                checkAuth(); // Retourner à la page de login
                return;
            }
            
            const settings = await response.json();

            if (!response.ok) {
                throw new Error(settings.message || 'Erreur lors du chargement des données.');
            }
            
            // Récupérer la liste des inscrits séparément pour alléger le getSettings
            const regResponse = await fetch(`${API_BASE_URL}/getEmails`);
            const regData = await regResponse.json();
            const registrations = regData.registrations || [];


            // 1. Charger les Settings dans le formulaire
            titleInput.value = settings.title_text || '';
            subtitleInput.value = settings.subtitle_text || ''; 
            buttonInput.value = settings.button_text || '';
            maxUsersInput.value = settings.max_users || 5;
            regOpenInput.checked = settings.registration_open || false;
            reqFNameInput.checked = settings.require_first_name || false;
            reqLNameInput.checked = settings.require_last_name || false;
            reqPhoneInput.checked = settings.require_phone || false;
            
            // NOUVEAUX CHAMPS DE TEXTE
            statusTitleInput.value = settings.status_title || ''; 
            statusTextTplInput.value = settings.status_text_tpl || ''; 
            remainingTextTplInput.value = settings.remaining_text_tpl || ''; 
            listTitleInput.value = settings.list_title || ''; 
            limitTitleInput.value = settings.limit_title || ''; 
            limitMessageInput.value = settings.limit_message || ''; 
            // NOTE : on ne charge jamais le mot de passe haché dans ce champ

            // 2. Mettre à jour la liste des inscrits
            adminRegCount.textContent = registrations.length;
            adminMaxCount.textContent = settings.max_users || 5;

            // Afficher/Cacher les colonnes du tableau
            thFName.classList.toggle('hidden', !settings.require_first_name);
            thLName.classList.toggle('hidden', !settings.require_last_name);
            thPhone.classList.toggle('hidden', !settings.require_phone);
            
            regListBody.innerHTML = '';
            if (registrations.length > 0) {
                registrations.forEach(reg => {
                    const row = regListBody.insertRow();
                    row.insertCell().textContent = reg.email;
                    
                    row.insertCell().textContent = reg.first_name || 'N/A';
                    row.cells[1].classList.toggle('hidden', !settings.require_first_name);
                    
                    row.insertCell().textContent = reg.last_name || 'N/A';
                    row.cells[2].classList.toggle('hidden', !settings.require_last_name);
                    
                    row.insertCell().textContent = reg.phone_number || 'N/A';
                    row.cells[3].classList.toggle('hidden', !settings.require_phone);
                    
                    row.insertCell().textContent = '-'; 
                });
            } else {
                 const row = regListBody.insertRow();
                 row.insertCell(0).textContent = 'Aucun inscrit pour le moment.';
                 row.cells[0].colSpan = 5; 
            }

        } catch (error) {
            console.error('Error loading admin data:', error);
            feedbackEl.textContent = error.message;
            feedbackEl.className = 'message error';
        }
    };

    // --- FONCTION DE SAUVEGARDE DES SETTINGS ---

    const saveSettings = async () => {
        saveButton.disabled = true;
        feedbackEl.textContent = 'Sauvegarde en cours...';
        feedbackEl.className = 'message';

        const newSettings = {
            title_text: titleInput.value.trim(),
            subtitle_text: subtitleInput.value.trim(), 
            button_text: buttonInput.value.trim(),
            max_users: parseInt(maxUsersInput.value, 10),
            registration_open: regOpenInput.checked,
            require_first_name: reqFNameInput.checked,
            require_last_name: reqLNameInput.checked,
            require_phone: reqPhoneInput.checked,
            
            // NOUVEAUX CHAMPS DE TEXTE
            status_title: statusTitleInput.value.trim(), 
            status_text_tpl: statusTextTplInput.value.trim(), 
            remaining_text_tpl: remainingTextTplInput.value.trim(), 
            list_title: listTitleInput.value.trim(), 
            limit_title: limitTitleInput.value.trim(), 
            limit_message: limitMessageInput.value.trim(), 
        };
        
        // Ajouter le mot de passe s'il a été saisi
        const newPassword = passwordInput.value.trim();
        if (newPassword !== '') {
            // Le backend se chargera du hachage
            newSettings.admin_password = newPassword; 
        }

        try {
            // Le backend vérifie l'auth et hashe le mot de passe si présent
            const response = await fetch(`${API_BASE_URL}/updateSettings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            
            if (response.status === 403) {
                 throw new Error('Session expirée ou non autorisée. Veuillez vous reconnecter.');
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde.');
            }

            feedbackEl.textContent = result.message || 'Paramètres sauvegardés !';
            feedbackEl.className = 'message success';
            passwordInput.value = ''; // Effacer le champ après l'envoi réussi
            loadAdminData(); // Recharger les données pour synchronisation

        } catch (error) {
            feedbackEl.textContent = error.message;
            feedbackEl.className = 'message error';
            if (error.message.includes('reconnecter')) {
                 setCookie(PASSWORD_COOKIE_NAME, '', -1); 
                 checkAuth(); 
            }
        } finally {
            saveButton.disabled = false;
        }
    };
    
    // --- FONCTION DE GESTION DE L'AUTHENTIFICATION ---
    
    const checkAuth = () => {
        const token = getCookie(PASSWORD_COOKIE_NAME);
        if (token) {
            // Un cookie existe, on suppose que l'utilisateur est authentifié pour l'interface
            loginContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
            loadAdminData();
        } else {
            // Pas de cookie, afficher la page de connexion
            dashboardContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }
    };
    
    const handleLogin = async (e) => {
        e.preventDefault();
        const password = loginPasswordInput.value.trim();
        loginPasswordInput.value = '';
        loginFeedbackEl.textContent = 'Connexion...';
        loginFeedbackEl.className = 'message';
        
        try {
            // Appel au nouveau endpoint backend pour la vérification du mot de passe
            const response = await fetch(`${API_BASE_URL}/adminLogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password }),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Erreur de connexion.');
            }
            
            // Si le backend renvoie OK, on définit le cookie et on charge le dashboard
            setCookie(PASSWORD_COOKIE_NAME, result.token, 1); // Token valide 1 jour
            loginFeedbackEl.textContent = 'Connexion réussie !';
            loginFeedbackEl.className = 'message success';
            checkAuth(); // Charge le dashboard
            
        } catch (error) {
            loginFeedbackEl.textContent = error.message;
            loginFeedbackEl.className = 'message error';
        }
    };


    // Événements
    saveButton.addEventListener('click', saveSettings);
    if(loginForm) loginForm.addEventListener('submit', handleLogin); 
    
    // Initialisation
    checkAuth(); 
});
