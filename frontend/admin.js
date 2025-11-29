// frontend/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginFormContainer = document.getElementById('login-form-container');
    const adminMessageFeedback = document.getElementById('admin-message-feedback');
    const loginMessageFeedback = document.getElementById('login-message-feedback');

    // Champs de settings
    const titleInput = document.getElementById('admin-title-text');
    const buttonInput = document.getElementById('admin-button-text');
    const maxUsersInput = document.getElementById('admin-max-users');
    const regOpenInput = document.getElementById('admin-registration-open');
    const reqFNameInput = document.getElementById('admin-require-first-name');
    const reqLNameInput = document.getElementById('admin-require-last-name');
    const reqPhoneInput = document.getElementById('admin-require-phone');
    const passwordInput = document.getElementById('admin-password-input'); // Champ de NOUVEAU mot de passe

    // Connexion
    const loginButton = document.getElementById('login-btn');
    const loginPasswordInput = document.getElementById('login-password-input');
    const logoutBtn = document.getElementById('logout-btn');

    // Boutons et listes
    const saveButton = document.getElementById('save-settings-btn');
    const regListBody = document.getElementById('admin-registrations-list');
    const adminRegCount = document.getElementById('admin-registered-count');
    const adminMaxCount = document.getElementById('admin-max-count');
    const thFName = document.getElementById('th-first-name');
    const thLName = document.getElementById('th-last-name');
    const thPhone = document.getElementById('th-phone');


    const API_BASE_URL = '/api';
    let CURRENT_SETTINGS = {};

    // --- Fonctions d'affichage ---

    const showLogin = (message = null) => {
        loginFormContainer.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        if (message) {
            loginMessageFeedback.textContent = message;
            loginMessageFeedback.className = 'message error';
        } else {
             loginMessageFeedback.textContent = '';
             loginMessageFeedback.className = 'message';
        }
        // Réinitialiser le champ de mot de passe de connexion
        loginPasswordInput.value = '';
        loginButton.disabled = false;
        loginButton.textContent = 'Se Connecter';
    };

    const showDashboard = () => {
        loginFormContainer.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
    };

    // --- Logique de connexion ---

    const handleLogin = async (e) => {
        e.preventDefault();
        const password = loginPasswordInput.value.trim();

        if (!password) {
            loginMessageFeedback.textContent = 'Veuillez entrer le mot de passe.';
            loginMessageFeedback.className = 'message error';
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'Connexion...';
        loginMessageFeedback.textContent = '';
        loginMessageFeedback.className = 'message';

        try {
            const response = await fetch(`${API_BASE_URL}/adminLogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Mot de passe incorrect ou erreur.');
            }

            sessionStorage.setItem('adminLoggedIn', 'true');
            await loadAdminData(); // Charge le dashboard après connexion
            
        } catch (error) {
            loginMessageFeedback.textContent = error.message;
            loginMessageFeedback.className = 'message error';
            loginButton.disabled = false;
            loginButton.textContent = 'Se Connecter';
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
        showLogin();
    };


    // --- Logique de Chargement/Affichage du Dashboard ---

    const loadAdminData = async () => {
        adminMessageFeedback.textContent = 'Chargement des données...';
        adminMessageFeedback.className = 'message';

        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            const data = await response.json();

            if (!response.ok) {
                 // Gère l'erreur critique de la ligne ID=1 manquante
                throw new Error(data.message || 'Erreur de connexion aux données. (Vérifiez la ligne ID=1 dans la table settings)');
            }

            CURRENT_SETTINGS = data.settings;
            const registrations = data.registrations;

            // 1. Logique d'affichage (Connexion vs Configuration)
            const passwordHashExists = CURRENT_SETTINGS.admin_password;

            if (passwordHashExists && sessionStorage.getItem('adminLoggedIn') !== 'true') {
                // Si le mot de passe existe MAIS l'utilisateur n'est PAS connecté
                return showLogin('Accès restreint. Veuillez vous connecter.');
            } else if (!passwordHashExists) {
                // Si le mot de passe n'existe PAS (Première configuration)
                showDashboard();
                adminMessageFeedback.textContent = "ATTENTION : Veuillez définir un mot de passe Admin ci-dessous pour sécuriser l'accès.";
                adminMessageFeedback.className = 'message error';
            } else {
                // Si le mot de passe existe ET l'utilisateur est connecté
                showDashboard();
                adminMessageFeedback.textContent = ''; // Efface le message de chargement
                adminMessageFeedback.className = 'message';
            }

            // 2. Mise à jour des champs du formulaire
            titleInput.value = CURRENT_SETTINGS.title_text || '';
            buttonInput.value = CURRENT_SETTINGS.button_text || '';
            maxUsersInput.value = CURRENT_SETTINGS.max_users || 5;
            regOpenInput.checked = CURRENT_SETTINGS.registration_open;
            reqFNameInput.checked = CURRENT_SETTINGS.require_first_name;
            reqLNameInput.checked = CURRENT_SETTINGS.require_last_name;
            reqPhoneInput.checked = CURRENT_SETTINGS.require_phone;
            passwordInput.value = ''; // Jamais pré-rempli pour la sécurité

            // 3. Affichage de la liste des inscrits
            adminRegCount.textContent = registrations.length;
            adminMaxCount.textContent = CURRENT_SETTINGS.max_users;

            // Affichage conditionnel des colonnes
            thFName.classList.toggle('hidden', !CURRENT_SETTINGS.require_first_name);
            thLName.classList.toggle('hidden', !CURRENT_SETTINGS.require_last_name);
            thPhone.classList.toggle('hidden', !CURRENT_SETTINGS.require_phone);

            regListBody.innerHTML = '';
            registrations.forEach(reg => {
                const tr = document.createElement('tr');
                let html = `<td>${reg.email}</td>`;

                if (CURRENT_SETTINGS.require_first_name) html += `<td>${reg.first_name || 'N/A'}</td>`;
                if (CURRENT_SETTINGS.require_last_name) html += `<td>${reg.last_name || 'N/A'}</td>`;
                if (CURRENT_SETTINGS.require_phone) html += `<td>${reg.phone_number || 'N/A'}</td>`;

                html += `<td><button class="cta-button" style="padding: 5px 10px; font-size: 0.8rem; background: var(--error-color);">Supprimer</button></td>`;

                tr.innerHTML = html;
                regListBody.appendChild(tr);
            });


        } catch (error) {
            // Si le fetch échoue (problème Supabase ou Netlify), on montre l'erreur
            showLogin(error.message);
        }
    };

    // --- Logique de Sauvegarde ---

    const saveSettings = async () => {
        saveButton.disabled = true;
        adminMessageFeedback.textContent = 'Sauvegarde en cours...';
        adminMessageFeedback.className = 'message';

        const newSettings = {
            title_text: titleInput.value.trim(),
            button_text: buttonInput.value.trim(),
            // Conserver le message de limite existant si non modifié par l'admin
            limit_message: CURRENT_SETTINGS.limit_message || "Désolé, toutes les places sont prises.", 
            max_users: parseInt(maxUsersInput.value, 10),
            registration_open: regOpenInput.checked,
            require_first_name: reqFNameInput.checked,
            require_last_name: reqLNameInput.checked,
            require_phone: reqPhoneInput.checked,
            // Seulement inclure le mot de passe s'il est rempli (sera haché par le backend)
            ...(passwordInput.value.trim() && { admin_password: passwordInput.value.trim() }) 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/updateSettings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde.');
            }

            adminMessageFeedback.textContent = result.message || 'Paramètres sauvegardés !';
            adminMessageFeedback.className = 'message success';
            passwordInput.value = ''; // Réinitialise le champ après envoi
            await loadAdminData(); // Recharger les données pour synchronisation

        } catch (error) {
            adminMessageFeedback.textContent = error.message;
            adminMessageFeedback.className = 'message error';
        } finally {
            saveButton.disabled = false;
        }
    };

    // --- Initialisation ---
    saveButton.addEventListener('click', saveSettings);
    loginFormContainer.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    loadAdminData();
});
