// frontend/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginFormContainer = document.getElementById('login-form-container');
    const adminMessageFeedback = document.getElementById('admin-message-feedback');
    const loginMessageFeedback = document.getElementById('login-message-feedback');

    // Champs de settings
    const titleInput = document.getElementById('admin-title-text');
    const subtitleInput = document.getElementById('admin-subtitle-text');
    const buttonInput = document.getElementById('admin-button-text');
    
    const statusTitleInput = document.getElementById('admin-status-title');
    const statusTextTplInput = document.getElementById('admin-status-text-tpl');
    const remainingTextTplInput = document.getElementById('admin-remaining-text-tpl');
    const listTitleInput = document.getElementById('admin-list-title');
    
    const limitTitleInput = document.getElementById('admin-limit-title');
    const limitMessageInput = document.getElementById('admin-limit-message');

    const maxUsersInput = document.getElementById('admin-max-users');
    const regOpenInput = document.getElementById('admin-registration-open');
    const reqFNameInput = document.getElementById('admin-require-first-name');
    const reqLNameInput = document.getElementById('admin-require-last-name');
    const reqPhoneInput = document.getElementById('admin-require-phone');
    const passwordInput = document.getElementById('admin-password-input'); 

    // Connexion
    const loginPasswordInput = document.getElementById('login-password-input');
    const logoutBtn = document.getElementById('logout-btn');

    // Boutons & liste
    const saveButton = document.getElementById('save-settings-btn');
    const regListBody = document.getElementById('admin-registrations-list');
    const adminRegCount = document.getElementById('admin-registered-count');
    const adminTrashCount = document.getElementById('admin-trash-count');
    const adminMaxCount = document.getElementById('admin-max-count');
    const viewActiveBtn = document.getElementById('view-active-btn');
    const viewTrashBtn = document.getElementById('view-trash-btn');

    // Entêtes colonnes conditionnelles
    const thFirstName = document.getElementById('th-first-name');
    const thLastName = document.getElementById('th-last-name');
    const thPhone = document.getElementById('th-phone');

    const API_BASE_URL = '/api';
    let ALL_REGISTRATIONS = [];
    let CURRENT_SETTINGS = {};
    let CURRENT_VIEW = 'active'; // 'active' | 'trash'

    // --- Connexion admin ---
    const handleLogin = async (e) => {
        e.preventDefault();
        const password = loginPasswordInput.value.trim();
        if (!password) return;

        loginPasswordInput.disabled = true;
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
                throw new Error(result.message || 'Erreur de connexion.');
            }
            
            // Cookie admin 24h
            document.cookie = "admin_auth=VALID_ADMIN_SESSION_2024; path=/; max-age=" + (60 * 60 * 24);
            
            loginFormContainer.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            adminMessageFeedback.textContent = 'Connexion réussie.';
            adminMessageFeedback.className = 'message success';
            loginPasswordInput.value = ''; 
            
            await loadAdminData();

        } catch (error) {
            loginMessageFeedback.textContent = error.message;
            loginMessageFeedback.className = 'message error';
        } finally {
            loginPasswordInput.disabled = false;
        }
    };
    
    const handleLogout = () => {
        document.cookie = "admin_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        adminDashboard.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
        adminMessageFeedback.textContent = 'Déconnexion réussie.';
        adminMessageFeedback.className = 'message success';
    };


    // --- Chargement des données Admin ---
    const loadAdminData = async () => {
        adminMessageFeedback.textContent = 'Chargement des données...';
        adminMessageFeedback.className = 'message';
        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`); 
            if (!response.ok) throw new Error('Erreur de chargement des données.');

            const data = await response.json();
            CURRENT_SETTINGS = data.settings || {};
            ALL_REGISTRATIONS = data.registrations || [];

            // 1. Charger les settings dans les inputs
            titleInput.value = CURRENT_SETTINGS.title_text || '';
            subtitleInput.value = CURRENT_SETTINGS.subtitle_text || '';
            buttonInput.value = CURRENT_SETTINGS.button_text || '';
            statusTitleInput.value = CURRENT_SETTINGS.status_title || '';
            statusTextTplInput.value = CURRENT_SETTINGS.status_text_tpl || '';
            remainingTextTplInput.value = CURRENT_SETTINGS.remaining_text_tpl || '';
            listTitleInput.value = CURRENT_SETTINGS.list_title || '';
            limitTitleInput.value = CURRENT_SETTINGS.limit_title || '';
            limitMessageInput.value = CURRENT_SETTINGS.limit_message || '';

            maxUsersInput.value = CURRENT_SETTINGS.max_users || 5;
            regOpenInput.checked = !!CURRENT_SETTINGS.registration_open;
            reqFNameInput.checked = !!CURRENT_SETTINGS.require_first_name;
            reqLNameInput.checked = !!CURRENT_SETTINGS.require_last_name;
            reqPhoneInput.checked = !!CURRENT_SETTINGS.require_phone;

            // 2. Colonnes dynamiques
            thFirstName.classList.toggle('hidden', !CURRENT_SETTINGS.require_first_name);
            thLastName.classList.toggle('hidden', !CURRENT_SETTINGS.require_last_name);
            thPhone.classList.toggle('hidden', !CURRENT_SETTINGS.require_phone);
            
            // 3. Rendu du tableau
            renderRegistrationsTable(ALL_REGISTRATIONS);
            
            adminMessageFeedback.textContent = 'Données chargées.';
            adminMessageFeedback.className = 'message success';

        } catch (error) {
            console.error('Erreur loadAdminData:', error);
            adminMessageFeedback.textContent = "Erreur: Impossible de charger les données de la campagne. (Erreur Serveur/BDD)";
            adminMessageFeedback.className = 'message error';
        }
    };

    // --- Sauvegarde des settings ---
    const saveSettings = async () => {
        saveButton.disabled = true;
        adminMessageFeedback.textContent = '';
        adminMessageFeedback.className = 'message';

        const newSettings = {
            title_text: titleInput.value.trim(),
            subtitle_text: subtitleInput.value.trim(),
            button_text: buttonInput.value.trim(),
            
            status_title: statusTitleInput.value.trim(), 
            status_text_tpl: statusTextTplInput.value.trim(),
            remaining_text_tpl: remainingTextTplInput.value.trim(),
            list_title: listTitleInput.value.trim(),
            limit_title: limitTitleInput.value.trim(),
            limit_message: limitMessageInput.value.trim(), 
            
            max_users: parseInt(maxUsersInput.value, 10),
            registration_open: regOpenInput.checked,
            require_first_name: reqFNameInput.checked,
            require_last_name: reqLNameInput.checked,
            require_phone: reqPhoneInput.checked,
            ...(passwordInput.value.trim() && { admin_password: passwordInput.value.trim() }),
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
            passwordInput.value = ''; 
            await loadAdminData();

        } catch (error) {
            adminMessageFeedback.textContent = error.message;
            adminMessageFeedback.className = 'message error';
        } finally {
            saveButton.disabled = false;
        }
    };

    // --- Tableau des inscrits (Actifs / Corbeille) ---
    const renderRegistrationsTable = (registrations) => {
        regListBody.innerHTML = '';
        
        const activeUsers = registrations.filter(reg => !reg.is_deleted);
        const trashUsers = registrations.filter(reg => reg.is_deleted);
        
        adminRegCount.textContent = activeUsers.length;
        adminTrashCount.textContent = trashUsers.length;
        adminMaxCount.textContent = CURRENT_SETTINGS.max_users || 5;

        const listToDisplay = (CURRENT_VIEW === 'active') ? activeUsers : trashUsers;
        
        viewActiveBtn.classList.toggle('active', CURRENT_VIEW === 'active');
        viewTrashBtn.classList.toggle('active', CURRENT_VIEW === 'trash');

        if (listToDisplay.length === 0) {
            regListBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">${
                CURRENT_VIEW === 'active'
                    ? "Aucun inscrit actif pour l'instant."
                    : 'La corbeille est vide.'
            }</td></tr>`;
            return;
        }

        listToDisplay.forEach((reg) => {
            const tr = document.createElement('tr');
            
            tr.innerHTML += `<td>${reg.email}</td>`;
            
            if (CURRENT_SETTINGS.require_first_name) {
                tr.innerHTML += `<td>${reg.first_name || '-'}</td>`;
            }
            if (CURRENT_SETTINGS.require_last_name) {
                tr.innerHTML += `<td>${reg.last_name || '-'}</td>`;
            }
            if (CURRENT_SETTINGS.require_phone) {
                tr.innerHTML += `<td>${reg.phone_number || '-'}</td>`;
            }
            
            let actionsHtml = `<div class="cell-with-actions">`;
            
            if (CURRENT_VIEW === 'active') {
                actionsHtml += `<button class="action-btn delete" data-id="${reg.id}" data-action="delete">Mettre en corbeille</button>`;
            } else {
                actionsHtml += `<button class="action-btn restore" data-id="${reg.id}" data-action="restore">Restaurer</button>`;
                actionsHtml += `<button class="action-btn delete-force" data-id="${reg.id}" data-action="forceDelete">Supprimer définitif</button>`;
            }

            actionsHtml += `</div>`;
            tr.innerHTML += `<td>${actionsHtml}</td>`;
            
            regListBody.appendChild(tr);
        });

        regListBody.removeEventListener('click', handleRegistrationAction); 
        regListBody.addEventListener('click', handleRegistrationAction);
    };

    // --- Actions sur les inscrits ---
    const handleRegistrationAction = async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;
        let endpoint = '';
        let confirmMessage = '';

        if (action === 'delete') {
            endpoint = 'softDelete';
            confirmMessage = "Mettre cet inscrit dans la corbeille ?";
        } else if (action === 'restore') {
            endpoint = 'restore';
            confirmMessage = "Restaurer cet inscrit ?";
        } else if (action === 'forceDelete') {
            endpoint = 'forceDelete';
            confirmMessage = "SUPPRESSION DÉFINITIVE de cet inscrit ? (Action irréversible)";
        } else {
            return;
        }

        if (action === 'forceDelete' || confirm(confirmMessage)) {
            adminMessageFeedback.textContent = 'Action en cours...';
            adminMessageFeedback.className = 'message';

            try {
                const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `Erreur lors de l'action '${action}'.`);
                }

                adminMessageFeedback.textContent = result.message || `Action '${action}' réussie.`;
                adminMessageFeedback.className = 'message success';
                
                await loadAdminData();

            } catch (error) {
                adminMessageFeedback.textContent = error.message;
                adminMessageFeedback.className = 'message error';
            }
        }
    };
    
    const switchView = (view) => {
        if (CURRENT_VIEW === view) return;
        CURRENT_VIEW = view;
        renderRegistrationsTable(ALL_REGISTRATIONS);
    };


    // --- Initialisation ---
    saveButton.addEventListener('click', saveSettings);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    viewActiveBtn.addEventListener('click', () => switchView('active'));
    viewTrashBtn.addEventListener('click', () => switchView('trash'));

    // Si un cookie admin est présent, on affiche directement le dashboard
    const hasAdminCookie = document.cookie.includes('admin_auth=VALID_ADMIN_SESSION_2024');
    if (hasAdminCookie) {
        loginFormContainer.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        loadAdminData();
    } else {
        adminDashboard.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    }
});