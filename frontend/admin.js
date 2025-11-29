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
    const passwordInput = document.getElementById('admin-password-input');

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

    // --- Fonctions Utilitaires ---

    // Fonction pour copier dans le presse-papier
    window.copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            // Petit feedback visuel temporaire
            const originalText = adminMessageFeedback.textContent;
            adminMessageFeedback.textContent = `Copié : ${text}`;
            adminMessageFeedback.className = 'message success';
            setTimeout(() => {
                adminMessageFeedback.textContent = originalText;
                adminMessageFeedback.className = 'message';
            }, 2000);
        }).catch(err => {
            console.error('Erreur copie:', err);
            adminMessageFeedback.textContent = 'Erreur lors de la copie.';
            adminMessageFeedback.className = 'message error';
        });
    };

    // Fonction pour supprimer (Trash)
    window.deleteUser = async (email, btnElement) => {
        if (!confirm(`Voulez-vous vraiment déplacer ${email} dans la corbeille ? Il ne pourra pas se réinscrire.`)) return;

        btnElement.disabled = true;
        btnElement.textContent = '...';

        try {
            const response = await fetch(`${API_BASE_URL}/deleteEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });

            if (!response.ok) throw new Error('Erreur suppression');

            // Recharger les données pour mettre à jour la liste
            await loadAdminData();

        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression.");
            btnElement.disabled = false;
            btnElement.textContent = 'Supprimer';
        }
    };

    // --- Affichage ---

    const showLogin = (message = null) => {
        loginFormContainer.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        logoutBtn.style.display = 'none'; // Cacher le bouton déconnexion
        if (message) {
            loginMessageFeedback.textContent = message;
            loginMessageFeedback.className = 'message error';
        } else {
             loginMessageFeedback.textContent = '';
             loginMessageFeedback.className = 'message';
        }
        loginPasswordInput.value = '';
        loginButton.disabled = false;
        loginButton.textContent = 'Se Connecter';
    };

    const showDashboard = () => {
        loginFormContainer.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        logoutBtn.style.display = 'inline-block'; // Afficher le bouton déconnexion
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

        try {
            const response = await fetch(`${API_BASE_URL}/adminLogin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur.');
            }

            sessionStorage.setItem('adminLoggedIn', 'true');
            await loadAdminData(); 

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

    // --- Chargement des données ---

    const loadAdminData = async () => {
        adminMessageFeedback.textContent = 'Chargement...';
        adminMessageFeedback.className = 'message';

        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            const data = await response.json();

            if (!response.ok) throw new Error('Erreur connexion données.');

            CURRENT_SETTINGS = data.settings;
            const registrations = data.registrations;

            const passwordHashExists = CURRENT_SETTINGS.admin_password;

            if (passwordHashExists && sessionStorage.getItem('adminLoggedIn') !== 'true') {
                return showLogin('Accès restreint. Connectez-vous.');
            } else if (!passwordHashExists) {
                showDashboard();
                adminMessageFeedback.textContent = "ATTENTION : Définissez un mot de passe Admin.";
                adminMessageFeedback.className = 'message error';
            } else {
                showDashboard();
                adminMessageFeedback.textContent = 'Dashboard à jour.';
                adminMessageFeedback.className = 'message success';
            }

            // Champs Settings
            titleInput.value = CURRENT_SETTINGS.title_text || '';
            buttonInput.value = CURRENT_SETTINGS.button_text || '';
            maxUsersInput.value = CURRENT_SETTINGS.max_users || 5;
            regOpenInput.checked = CURRENT_SETTINGS.registration_open;
            reqFNameInput.checked = CURRENT_SETTINGS.require_first_name;
            reqLNameInput.checked = CURRENT_SETTINGS.require_last_name;
            reqPhoneInput.checked = CURRENT_SETTINGS.require_phone;
            passwordInput.value = ''; 

            // Compteurs
            adminRegCount.textContent = registrations.length;
            adminMaxCount.textContent = CURRENT_SETTINGS.max_users;

            // Table Colonnes
            thFName.classList.toggle('hidden', !CURRENT_SETTINGS.require_first_name);
            thLName.classList.toggle('hidden', !CURRENT_SETTINGS.require_last_name);
            thPhone.classList.toggle('hidden', !CURRENT_SETTINGS.require_phone);

            // Remplissage Table
            regListBody.innerHTML = '';
            
            if (registrations.length === 0) {
                regListBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Aucun inscrit actif.</td></tr>';
            } else {
                registrations.forEach(reg => {
                    const tr = document.createElement('tr');
                    
                    // Email avec bouton Copier
                    let html = `
                        <td class="cell-with-copy">
                            <span>${reg.email}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${reg.email}')" title="Copier l'email">📋</button>
                        </td>`;

                    if (CURRENT_SETTINGS.require_first_name) html += `<td>${reg.first_name || '-'}</td>`;
                    if (CURRENT_SETTINGS.require_last_name) html += `<td>${reg.last_name || '-'}</td>`;
                    
                    // Téléphone avec bouton Copier (si requis)
                    if (CURRENT_SETTINGS.require_phone) {
                        const phoneDisplay = reg.phone_number || '-';
                        if(reg.phone_number) {
                            html += `
                            <td class="cell-with-copy">
                                <span>${phoneDisplay}</span>
                                <button class="copy-btn" onclick="copyToClipboard('${reg.phone_number}')" title="Copier le numéro">📋</button>
                            </td>`;
                        } else {
                            html += `<td>${phoneDisplay}</td>`;
                        }
                    }

                    // Bouton Supprimer (Trash)
                    html += `
                        <td style="text-align: center;">
                            <button class="cta-button delete-btn" onclick="deleteUser('${reg.email}', this)">
                                🗑️ Supprimer
                            </button>
                        </td>`;

                    tr.innerHTML = html;
                    regListBody.appendChild(tr);
                });
            }

        } catch (error) {
            showLogin(error.message);
        }
    };

    // --- Sauvegarde ---

    const saveSettings = async () => {
        saveButton.disabled = true;
        adminMessageFeedback.textContent = 'Sauvegarde...';
        adminMessageFeedback.className = 'message';

        const newSettings = {
            title_text: titleInput.value.trim(),
            button_text: buttonInput.value.trim(),
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

    saveButton.addEventListener('click', saveSettings);
    loginFormContainer.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    loadAdminData(); 
});
