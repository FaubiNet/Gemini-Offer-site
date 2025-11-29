document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const registeredCountEl = document.getElementById('registered-count');
    const remainingSpotsEl = document.getElementById('remaining-spots');
    const progressBarEl = document.getElementById('progress-bar');
    const emailListEl = document.getElementById('email-list');
    const emailForm = document.getElementById('email-form');
    const emailInput = document.getElementById('email-input');
    const submitButton = document.getElementById('submit-button');
    const messageFeedbackEl = document.getElementById('message-feedback');
    const registrationFormContainer = document.getElementById('registration-form-container');
    const limitReachedContainer = document.getElementById('limit-reached-container');

    // Use the /api/ redirect we set up in netlify.toml
    const API_BASE_URL = '/api';
    const MAX_USERS = 5;

    /**
     * Updates the UI with the latest data from the backend.
     */
    const updateUI = (data) => {
        const count = data.emails.length;
        const remaining = MAX_USERS - count;
        const progressPercentage = (count / MAX_USERS) * 100;

        registeredCountEl.textContent = count;
        remainingSpotsEl.textContent = remaining;
        progressBarEl.style.width = `${progressPercentage}%`;

        emailListEl.innerHTML = '';
        if (data.emails.length > 0) {
            data.emails.forEach(email => {
                const li = document.createElement('li');
                const [user, domain] = email.split('@');
                const obfuscatedUser = user.length > 2 ? `${user.substring(0, 2)}***` : `${user.substring(0,1)}***`;
                li.textContent = `${obfuscatedUser}@${domain}`;
                emailListEl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "Personne n'est encore inscrit. Sois le premier !";
            emailListEl.appendChild(li);
        }

        if (count >= MAX_USERS) {
            registrationFormContainer.classList.add('hidden');
            limitReachedContainer.classList.remove('hidden');
        } else {
            registrationFormContainer.classList.remove('hidden');
            limitReachedContainer.classList.add('hidden');
        }
    };

    /**
     * Fetches the current list of emails and updates the UI.
     */
    const fetchEmails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getEmails`);
            if (!response.ok) throw new Error('Failed to fetch data.');
            
            const data = await response.json();
            updateUI(data);
        } catch (error) {
            console.error('Error fetching emails:', error);
            messageFeedbackEl.textContent = 'Erreur de connexion au serveur.';
            messageFeedbackEl.className = 'message error';
        }
    };

    /**
     * Handles the email form submission.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        if (!email) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Enregistrement...';
        messageFeedbackEl.textContent = '';
        messageFeedbackEl.className = 'message';

        try {
            const response = await fetch(`${API_BASE_URL}/addEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An unknown error occurred.');
            }

            messageFeedbackEl.textContent = result.message;
            messageFeedbackEl.className = 'message success';
            emailInput.value = '';
            
            await fetchEmails();

        } catch (error) {
            messageFeedbackEl.textContent = error.message;
            messageFeedbackEl.className = 'message error';
        } finally {
            if (parseInt(registeredCountEl.textContent, 10) < MAX_USERS) {
                submitButton.disabled = false;
                submitButton.textContent = 'Sécuriser ma place';
            }
        }
    };

    emailForm.addEventListener('submit', handleFormSubmit);
    fetchEmails(); // Initial fetch
});
