const fs = require('fs');
const path = require('path');

// Fichier JSON livré avec le code (lecture seule)
const BUNDLE_EMAILS_PATH = path.resolve(__dirname, 'emails.json');
// Fichier JSON runtime (écrit par addEmail dans /tmp)
const RUNTIME_EMAILS_PATH = '/tmp/emails.json';

const loadEmailsSync = () => {
  try {
    // On essaie d'abord le fichier en /tmp (mis à jour)
    const data = fs.readFileSync(RUNTIME_EMAILS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Si rien en /tmp, on lit le JSON de base du bundle
      try {
        const data = fs.readFileSync(BUNDLE_EMAILS_PATH, 'utf8');
        return JSON.parse(data);
      } catch (e2) {
        console.error('Impossible de lire le emails.json du bundle :', e2);
        return { emails: [] };
      }
    }
    throw err;
  }
};

exports.handler = async (event, context) => {
  try {
    const jsonData = loadEmailsSync();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    };
  } catch (error) {
    console.error('Error reading emails.json:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erreur interne du serveur. Impossible de récupérer les emails.",
      }),
    };
  }
};
