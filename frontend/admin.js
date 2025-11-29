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
    
    // NOUVEAU: Champs de texte pour le statut
    const statusTitleInput = document.getElementById('admin-status-title');
    const statusTextInput = document.getElementById('admin-status-text');
    
    // NOUVEAU: Champs de texte pour la limite atteinte
    const limitTitleInput = document.getElementById('admin-limit-title');
    const limitMessageInput = document.getElementById('admin-limit-message');

    // Champs numériques et booléens
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

    // --- Fonctions Utilitaires ---

    // Fonction pour copier dans le presse-papier
    window.copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = adminMessageFeedback.textContent;
            adminMessageFeedback.textContent = `Copié : ${text}`;
            adminMessageFeedback.className = 'message success';
            setTimeout(() => {
                if (adminMessageFeedback.textContent.startsWith('Copié')) {
                    adminMessageFeedback.textContent = 'Dashboard à jour.';
                    adminMessageFeedback.className = 'message success';
                }
            }, 2000);
        }).catch(err => {
            console.error('Erreur copie:', err);
            adminMessageFeedback.textContent = 'Erreur lors de la copie.';
            adminMessageFeedback.className = 'message error';
        });
    };

    // Fonction pour supprimer
    window.deleteUser = async (email, btnElement) => {
        if (!confirm(`Voulez-vous vraiment déplacer ${email} dans la corbeille ?`)) return;

        btnElement.disabled = true;
        btnElement.textContent = '...';

        try {
            const response = await fetch(`${API_BASE_URL}/deleteEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Erreur suppression');
            }

            // Recharger les données pour mettre à jour la liste
            await loadAdminData();

        } catch (error) {
            console.error(error);
            alert(`Erreur lors de la suppression: ${error.message}`);
            btnElement.disabled = false;
            btnElement.textContent = '🗑️ Supprimer';
        }
    };

    // --- Affichage et Connexion ---

    const showLogin = (message = null) => {
        loginFormContainer.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        logoutBtn.style.display = 'none';
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
        logoutBtn.style.display = 'inline-block';
    };

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

            // Simule une session admin (non sécurisé, mais suit votre implémentation)
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
            // Utilise getEmails car il renvoie settings ET registrations
            const response = await fetch(`${API_BASE_URL}/getEmails`); 
            const data = await response.json();

            if (!response.ok) throw new Error('Erreur connexion données.');

            CURRENT_SETTINGS = data.settings;
            const registrations = data.registrations;

            const passwordHashExists = CURRENT_SETTINGS.admin_password;

            // Logique de connexion
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

            // Remplissage des Champs Settings
            titleInput.value = CURRENT_SETTINGS.title_text || '';
            buttonInput.value = CURRENT_SETTINGS.button_text || '';

            // NOUVEAU: Champs de texte pour le statut
            statusTitleInput.value = CURRENT_SETTINGS.status_title || '';
            statusTextInput.value = CURRENT_SETTINGS.status_text || '';

            // NOUVEAU: Champs de texte pour la limite atteinte
            limitTitleInput.value = CURRENT_SETTINGS.limit_title || '';
            limitMessageInput.value = CURRENT_SETTINGS.limit_message || '';
            
            // Champs numériques et booléens
            maxUsersInput.value = CURRENT_SETTINGS.max_users || 5;
            regOpenInput.checked = CURRENT_SETTINGS.registration_open;
            reqFNameInput.checked = CURRENT_SETTINGS.require_first_name;
            reqLNameInput.checked = CURRENT_SETTINGS.require_last_name;
            reqPhoneInput.checked = CURRENT_SETTINGS.require_phone;
            passwordInput.value = ''; 

            // Compteurs
            adminRegCount.textContent = registrations.length;
            adminMaxCount.textContent = CURRENT_SETTINGS.max_users;

            // Table Colonnes (Afficher/Cacher selon les exigences)
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
                    
                    // Code HTML pour une ligne (email, nom, tel, actions)
                    let html = `
                        <td class="cell-with-copy">
                            <span>${reg.email}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${reg.email.replace(/'/g, "\\'")}')" title="Copier l'email">📋</button>
                        </td>`;

                    if (CURRENT_SETTINGS.require_first_name) html += `<td>${reg.first_name || '-'}</td>`;
                    if (CURRENT_SETTINGS.require_last_name) html += `<td>${reg.last_name || '-'}</td>`;
                    
                    if (CURRENT_SETTINGS.require_phone) {
                        const phoneDisplay = reg.phone_number || '-';
                        if(reg.phone_number) {
                            // Assurez-vous d'échapper les caractères pour le onclick
                            const safePhone = reg.phone_number.replace(/'/g, "\\'");
                            html += `
                            <td class="cell-with-copy">
                                <span>${phoneDisplay}</span>
                                <button class="copy-btn" onclick="copyToClipboard('${safePhone}')" title="Copier le numéro">📋</button>
                            </td>`;
                        } else {
                            html += `<td>${phoneDisplay}</td>`;
                        }
                    } else if (!CURRENT_SETTINGS.require_first_name && !CURRENT_SETTINGS.require_last_name && !CURRENT_SETTINGS.require_phone) {
                         // Si tout est masqué, le téléphone reste affiché pour l'espace si c'est la 4e colonne
                        html += `<td>-</td>`; 
                    }


                    // Bouton Supprimer
                    // Assurez-vous d'échapper l'email pour le onclick
                    const safeEmail = reg.email.replace(/'/g, "\\'");
                    html += `
                        <td style="text-align: center;">
                            <button class="cta-button delete-btn" onclick="deleteUser('${safeEmail}', this)">
                                🗑️ Supprimer
                            </button>
                        </td>`;

                    tr.innerHTML = html;
                    regListBody.appendChild(tr);
                });
            }

        } catch (error) {
            // Si le chargement échoue (ex: pas de mot de passe Admin configuré ou erreur Supabase)
            showLogin(error.message);
        }
    };

    // --- Sauvegarde des paramètres ---

    const saveSettings = async () => {
        saveButton.disabled = true;
        adminMessageFeedback.textContent = 'Sauvegarde...';
        adminMessageFeedback.className = 'message';

        const newSettings = {
            title_text: titleInput.value.trim(),
            button_text: buttonInput.value.trim(),
            
            // NOUVEAU: Ajout des valeurs de texte
            status_title: statusTitleInput.value.trim(),
            status_text: statusTextInput.value.trim(),
            limit_title: limitTitleInput.value.trim(),
            limit_message: limitMessageInput.value.trim(),

            max_users: parseInt(maxUsersInput.value, 10),
            registration_open: regOpenInput.checked,
            require_first_name: reqFNameInput.checked,
            require_last_name: reqLNameInput.checked,
            require_phone: reqPhoneInput.checked,
            // N'envoie le mot de passe que s'il a été saisi
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
            passwordInput.value = ''; // Efface le champ après sauvegarde
            await loadAdminData(); 

        } catch (error) {
            adminMessageFeedback.textContent = error.message;
            adminMessageFeedback.className = 'message error';
        } finally {
            saveButton.disabled = false;
        }
    };

    // --- Initialisation des événements ---
    saveButton.addEventListener('click', saveSettings);
    loginFormContainer.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    loadAdminData(); 
});
