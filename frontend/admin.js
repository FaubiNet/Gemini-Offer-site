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
    const statusTitleInput = document.getElementById('admin-status-title');
    const statusTextInput = document.getElementById('admin-status-text');
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

    // Boutons et listes
    const saveButton = document.getElementById('save-settings-btn');
    const regListBody = document.getElementById('admin-registrations-list');
    const adminRegCount = document.getElementById('admin-registered-count');
    const adminMaxCount = document.getElementById('admin-max-count');
    
    // NOUVEAU: Boutons de vue et Compteurs Corbeille
    const viewActiveBtn = document.getElementById('view-active-btn');
    const viewTrashBtn = document.getElementById('view-trash-btn');
    const adminTrashCount = document.getElementById('admin-trash-count');
    
    // Headers de table
    const thFirstName = document.getElementById('th-first-name');
    const thLastName = document.getElementById('th-last-name');
    const thPhone = document.getElementById('th-phone');
    const thActions = document.getElementById('th-actions');


    const API_BASE_URL = '/api';
    let ALL_REGISTRATIONS = []; 
    let CURRENT_SETTINGS = {};
    let CURRENT_VIEW = 'active'; // 'active' ou 'trash'

    // --- NOUVELLE FONCTION: Masquage de l'email ---
    const maskEmail = (email) => {
        if (!email || typeof email !== 'string') return '';
        const parts = email.split('@');
        if (parts.length !== 2) return email;

        const [localPart, domain] = parts;
        
        // Afficher les 3 premiers caractères du nom d'utilisateur, puis "****"
        const maskedLocalPart = localPart.length > 3 
            ? localPart.substring(0, 3) + '****' + localPart.substring(localPart.length - 4)
            : '****'; // Au cas où le nom d'utilisateur est trop court
            
        return `${maskedLocalPart}@${domain}`;
    };

    // --- Mise à jour de l'UI des Inscriptions ---

    const renderRegistrationsTable = (registrations) => {
        regListBody.innerHTML = '';
        const filteredRegistrations = registrations.filter(reg => 
            CURRENT_VIEW === 'active' ? !reg.is_deleted : reg.is_deleted
        );
        
        // Mettre à jour les compteurs
        const activeCount = ALL_REGISTRATIONS.filter(reg => !reg.is_deleted).length;
        const trashCount = ALL_REGISTRATIONS.filter(reg => reg.is_deleted).length;
        adminRegCount.textContent = activeCount;
        adminTrashCount.textContent = trashCount;
        adminMaxCount.textContent = CURRENT_SETTINGS.max_users || 5;
        
        // Mettre à jour les classes actives des boutons
        viewActiveBtn.classList.toggle('active', CURRENT_VIEW === 'active');
        viewTrashBtn.classList.toggle('active', CURRENT_VIEW === 'trash');
        
        // Mettre à jour le texte du header d'actions
        thActions.textContent = CURRENT_VIEW === 'active' ? 'Actions' : 'Gestion Corbeille';

        if (filteredRegistrations.length === 0) {
            const row = regListBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = CURRENT_VIEW === 'active' 
                ? 'Aucun inscrit actif pour le moment.' 
                : 'La corbeille est vide.';
            cell.style.textAlign = 'center';
            return;
        }

        filteredRegistrations.forEach(reg => {
            const row = regListBody.insertRow();
            
            // Cellule Email (avec masquage)
            const emailCell = row.insertCell();
            emailCell.className = 'masked-email';
            emailCell.textContent = maskEmail(reg.email);

            // Autres cellules
            row.insertCell().textContent = reg.first_name || '';
            row.insertCell().textContent = reg.last_name || '';
            row.insertCell().textContent = reg.phone_number || '';

            // Cellule Actions
            const actionsCell = row.insertCell();
            actionsCell.className = 'cell-with-actions';

            if (CURRENT_VIEW === 'active') {
                // Bouton Mettre à la corbeille
                const trashBtn = document.createElement('button');
                trashBtn.textContent = 'Corbeille';
                trashBtn.className = 'action-btn delete';
                trashBtn.dataset.id = reg.id;
                trashBtn.dataset.action = 'soft-delete';
                actionsCell.appendChild(trashBtn);
            } else { // Vue Corbeille
                // Bouton Restaurer
                const restoreBtn = document.createElement('button');
                restoreBtn.textContent = 'Restaurer';
                restoreBtn.className = 'action-btn';
                restoreBtn.dataset.id = reg.id;
                restoreBtn.dataset.action = 'restore';
                actionsCell.appendChild(restoreBtn);

                // Bouton Supprimer définitivement
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Supprimer Déf.';
                deleteBtn.className = 'action-btn delete';
                deleteBtn.dataset.id = reg.id;
                deleteBtn.dataset.action = 'hard-delete';
                actionsCell.appendChild(deleteBtn);
            }
        });
        
        // Ajouter l'écouteur d'événement au conteneur de la table
        regListBody.removeEventListener('click', handleRegistrationAction); 
        regListBody.addEventListener('click', handleRegistrationAction);
    };
    
    // --- Gestion des Actions (Soft Delete, Hard Delete, Restore) ---
    const handleRegistrationAction = async (e) => {
        const target = e.target.closest('.action-btn');
        if (!target) return;

        const id = target.dataset.id;
        const action = target.dataset.action;
        const buttonText = target.textContent;
        
        let confirmMessage;
        let confirmAction = true;

        switch (action) {
            case 'soft-delete':
                confirmMessage = 'Êtes-vous sûr de vouloir déplacer cet inscrit dans la corbeille ?';
                break;
            case 'restore':
                confirmMessage = 'Êtes-vous sûr de vouloir restaurer cet inscrit ?';
                confirmAction = true; // Pas besoin de confirmation forte
                break;
            case 'hard-delete':
                confirmMessage = 'ATTENTION : La suppression est DÉFINITIVE. Continuer ?';
                confirmAction = confirm('Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT cet inscrit ? Cette action est irréversible.');
                break;
            default:
                return;
        }

        if (!confirmAction) return;

        target.disabled = true;
        target.textContent = 'En cours...';
        adminMessageFeedback.textContent = '';
        adminMessageFeedback.className = 'message';

        try {
            const response = await fetch(`${API_BASE_URL}/updateRegistrationStatus`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // Le cookie est automatiquement inclus par le navigateur s'il est défini
                },
                body: JSON.stringify({ id: id, action: action }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur d\'action.');
            }

            adminMessageFeedback.textContent = result.message;
            adminMessageFeedback.className = 'message success';
            await loadAdminData(); // Recharger les données et l'UI

        } catch (error) {
            adminMessageFeedback.textContent = error.message;
            adminMessageFeedback.className = 'message error';
            target.textContent = buttonText;
        } finally {
            target.disabled = false;
        }
    };


    // --- Chargement des données Admin ---
    const loadAdminData = async () => {
        try {
            // Utiliser le nouveau endpoint qui renvoie TOUTES les inscriptions et les settings
            const response = await fetch(`${API_BASE_URL}/getAdminData`); 
            
            // ... (Conservez la logique de vérification de session et de mise à jour des settings) ...
             if (response.status === 403) {
                // Si la session est expirée ou non valide
                adminDashboard.classList.add('hidden');
                loginFormContainer.classList.remove('hidden');
                return;
            }

            if (!response.ok) throw new Error('Erreur de chargement des données Admin.');

            const data = await response.json();
            ALL_REGISTRATIONS = data.registrations;
            CURRENT_SETTINGS = data.settings;
            
            // Afficher le tableau de bord
            adminDashboard.classList.remove('hidden');
            loginFormContainer.classList.add('hidden');

            // 1. Mettre à jour les champs de settings
            titleInput.value = data.settings.title_text || '';
            buttonInput.value = data.settings.button_text || '';
            statusTitleInput.value = data.settings.status_title || '';
            statusTextInput.value = data.settings.status_text || '';
            limitTitleInput.value = data.settings.limit_title || '';
            limitMessageInput.value = data.settings.limit_message || '';

            maxUsersInput.value = data.settings.max_users || 5;
            regOpenInput.checked = data.settings.registration_open;
            reqFNameInput.checked = data.settings.require_first_name;
            reqLNameInput.checked = data.settings.require_last_name;
            reqPhoneInput.checked = data.settings.require_phone;
            
            // 2. Mettre à jour l'affichage des colonnes du tableau
            thFirstName.classList.toggle('hidden', !data.settings.require_first_name);
            thLastName.classList.toggle('hidden', !data.settings.require_last_name);
            thPhone.classList.toggle('hidden', !data.settings.require_phone);
            
            // 3. Rendu du tableau (vue par défaut: 'active')
            renderRegistrationsTable(ALL_REGISTRATIONS);


        } catch (error) {
            console.error('Erreur loadAdminData:', error);
            adminMessageFeedback.textContent = error.message;
            adminMessageFeedback.className = 'message error';
            // Si le chargement échoue, on revient au login
            adminDashboard.classList.add('hidden');
            loginFormContainer.classList.remove('hidden');
        }
    };
    
    // --- Fonction de Sauvegarde ---
    const saveSettings = async () => {
        saveButton.disabled = true;
        adminMessageFeedback.textContent = '';
        adminMessageFeedback.className = 'message';
        
        const newSettings = {
            title_text: titleInput.value.trim(),
            button_text: buttonInput.value.trim(),
            status_title: statusTitleInput.value.trim(),
            status_text: statusTextInput.value.trim(),
            limit_title: limitTitleInput.value.trim(),
            limit_message: limitMessageInput.value.trim(),

            max_users: parseInt(maxUsersInput.value, 10),
            registration_open: regOpenInput.checked,
            require_first_name: reqFNameInput.checked,
            require_last_name: reqLNameInput.checked,
            require_phone: reqPhoneInput.checked,
            ...(passwordInput.value.trim() && { admin_password: passwordInput.value.trim() }) 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/updateSettings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            adminMessageFeedback.textContent = 'Sauvegardé !';
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


    // --- Fonctions de Login / Logout ---
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

            // Définir le cookie de session (détails omis, seulement l'appel)
            document.cookie = "admin_auth=VALID_ADMIN_SESSION_2024; path=/; max-age=3600; Secure; HttpOnly=false";
            
            loginMessageFeedback.textContent = result.message;
            loginMessageFeedback.className = 'message success';
            loginPasswordInput.value = ''; // Effacer le mot de passe
            
            await loadAdminData();

        } catch (error) {
            loginMessageFeedback.textContent = error.message;
            loginMessageFeedback.className = 'message error';
        } finally {
            loginPasswordInput.disabled = false;
        }
    };

    const handleLogout = () => {
        // Supprimer le cookie
        document.cookie = "admin_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        adminDashboard.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
        adminMessageFeedback.textContent = 'Déconnexion réussie.';
        adminMessageFeedback.className = 'message success';
    };

    // --- Gestion du changement de vue ---
    const switchView = (view) => {
        if (CURRENT_VIEW === view) return;
        CURRENT_VIEW = view;
        renderRegistrationsTable(ALL_REGISTRATIONS);
    };


    // --- Initialisation ---
    saveButton.addEventListener('click', saveSettings);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // NOUVEAU: Écouteurs pour les boutons de vue
    viewActiveBtn.addEventListener('click', () => switchView('active'));
    viewTrashBtn.addEventListener('click', () => switchView('trash'));

    loadAdminData();
});
