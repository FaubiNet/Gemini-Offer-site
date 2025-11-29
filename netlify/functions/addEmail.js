const fs = require('fs/promises');
const path = require('path');

// Fichier JSON livré avec le code (lecture seule)
const BUNDLE_EMAILS_PATH = path.resolve(__dirname, 'emails.json');
// Fichier JSON utilisé en écriture à l'exécution (dans /tmp, qui est writable)
const RUNTIME_EMAILS_PATH = '/tmp/emails.json';

const MAX_USERS = 5;

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Charge les emails : d'abord dans /tmp, sinon depuis le bundle en lecture seule
const loadEmails = async () => {
  try {
    const data = await fs.readFile(RUNTIME_EMAILS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Si le fichier n'existe pas encore dans /tmp, on part du JSON du bundle
      try {
        const data = await fs.readFile(BUNDLE_EMAILS_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e2) {
        console.error('Impossible de lire le emails.json du bundle :', e2);
        return { emails: [] };
      }
    }
    throw err;
  }
};

// Sauvegarde les emails dans /tmp
const saveEmails = async (jsonData) => {
  await fs.writeFile(
    RUNTIME_EMAILS_PATH,
    JSON.stringify(jsonData, null, 2),
    'utf8'
  );
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const email = (body.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Veuillez entrer une adresse e-mail valide.' }),
      };
    }

    // Charger les données existantes
    const jsonData = await loadEmails();
    if (!Array.isArray(jsonData.emails)) {
      jsonData.emails = [];
    }

    // Vérifier si déjà plein
    if (jsonData.emails.length >= MAX_USERS) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Le nombre maximum de participants est atteint. Désolé !',
        }),
      };
    }

    // Vérifier si email déjà inscrit
    if (jsonData.emails.includes(email)) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: 'Cet email est déjà inscrit.',
        }),
      };
    }

    // Ajouter le nouvel email
    jsonData.emails.push(email);

    // Sauvegarder dans /tmp
    await saveEmails(jsonData);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Félicitations ! Votre place est réservée.',
        data: jsonData,
      }),
    };
  } catch (error) {
    console.error('Error in addEmail function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Erreur interne du serveur. Veuillez réessayer.',
      }),
    };
  }
};
