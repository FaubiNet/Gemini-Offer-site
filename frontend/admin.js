// frontend/admin.js
document.addEventListener('DOMContentLoaded', () => {
    // Éléments du formulaire de settings
    const titleInput = document.getElementById('admin-title-text');
    const buttonInput = document.getElementById('admin-button-text');
    const maxUsersInput = document.getElementById('admin-max-users');
    const regOpenInput = document.getElementById('admin-registration-open');
    const reqFNameInput = document.getElementById('admin-require-first-name');
    const reqLNameInput = document.getElementById('admin-require-last-name');
    const reqPhoneInput = document.getElementById('admin-require-phone');
    const saveButton = document.getElementById('save-settings-btn');
    const feedbackEl = document.getElementById('admin-message-feedback');

    // Éléments de la liste des inscrits
    const regListBody = document.getElementById('admin-registrations-list');
    const adminRegCount = document.getElementById('admin-registered-count');
    const adminMaxCount = document.getElementById('admin-max-count');
    const thFName = document.getElementById('th-first-name');
    const thLName = document.getElementById('th-last-name');
    const thPhone = document.getElementById('th-phone');

    const API_BASE_URL = '/api';

    /**
     * Lit les settings et les inscrits du backend et met à jour l'admin UI.
     */
    const loadAdminData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            const data = await response.json(); // Contient settings et registrations
            
            const settings = data.settings || {};
            const registrations = data.registrations || [];

            // 1. Charger les settings dans le formulaire
            titleInput.value = settings.title_text || '';
            buttonInput.value = settings.button_text || '';
            maxUsersInput.value = settings.max_users || 5;
            regOpenInput.checked = settings.registration_open;
            reqFNameInput.checked = settings.require_first_name;
            reqLNameInput.checked = settings.require_last_name;
            reqPhoneInput.checked = settings.require_phone;
            
            // 2. Mettre à jour la liste des inscrits
            updateRegistrationsList(registrations, settings);

        } catch (error) {
            console.error('Erreur de chargement des données admin:', error);
            feedbackEl.textContent = 'Erreur lors du chargement du Dashboard.';
            feedbackEl.className = 'message error';
        }
    };

    /**
     * Met à jour le tableau des inscrits.
     */
    const updateRegistrationsList = (registrations, settings) => {
        regListBody.innerHTML = '';
        const activeFields = [
            { key: 'first_name', active: settings.require_first_name, th: thFName },
            { key: 'last_name', active: settings.require_last_name, th: thLName },
            { key: 'phone_number', active: settings.require_phone, th: thPhone }
        ];

        // Afficher/Masquer les colonnes du tableau
        activeFields.forEach(f => f.th.classList.toggle('hidden', !f.active));
        
        adminRegCount.textContent = registrations.length;
        adminMaxCount.textContent = settings.max_users || 5;

        if (registrations.length === 0) {
            const row = regListBody.insertRow();
            row.innerHTML = `<td colspan="5">Aucun inscrit pour le moment.</td>`;
            return;
        }

        registrations.forEach(reg => {
            const row = regListBody.insertRow();
            
            // Cellule Email
            row.insertCell().textContent = reg.email;
            
            // Cellules des champs optionnels
            activeFields.forEach(f => {
                if (f.active) {
                    row.insertCell().textContent = reg[f.key] || 'N/A';
                }
            });

            // Cellule Actions (Bouton Copier)
            const actionsCell = row.insertCell();
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copier';
            copyBtn.className = 'copy-btn';
            
            // Création de la chaîne à copier
            const copyText = [
                `Email: ${reg.email}`
            ];
            activeFields.forEach(f => {
                if (f.active && reg[f.key]) {
                    copyText.push(`${f.th.textContent.replace(' :', '')}: ${reg[f.key]}`);
                }
            });

            copyBtn.onclick = () => {
                navigator.clipboard.writeText(copyText.join('\n'));
                copyBtn.textContent = 'Copié !';
                setTimeout(() => copyBtn.textContent = 'Copier', 2000);
            };
            
            actionsCell.appendChild(copyBtn);
        });
    };

    /**
     * Enregistre les settings modifiés par l'admin.
     */
    const saveSettings = async () => {
        saveButton.disabled = true;
        feedbackEl.textContent = 'Sauvegarde en cours...';
        feedbackEl.className = 'message';

        const newSettings = {
            title_text: titleInput.value.trim(),
            button_text: buttonInput.value.trim(),
            max_users: parseInt(maxUsersInput.value, 10),
            registration_open: regOpenInput.checked,
            require_first_name: reqFNameInput.checked,
            require_last_name: reqLNameInput.checked,
            require_phone: reqPhoneInput.checked,
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

            feedbackEl.textContent = result.message || 'Paramètres sauvegardés !';
            feedbackEl.className = 'message success';
            loadAdminData(); // Recharger les données pour synchronisation

        } catch (error) {
            feedbackEl.textContent = error.message;
            feedbackEl.className = 'message error';
        } finally {
            saveButton.disabled = false;
        }
    };

    saveButton.addEventListener('click', saveSettings);
    loadAdminData(); // Chargement initial des données admin
});
