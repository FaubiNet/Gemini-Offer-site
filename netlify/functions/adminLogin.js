// netlify/functions/adminLogin.js
const { createClient } = require('@supabase/supabase-js');

// La dépendance bcryptjs n'est plus nécessaire

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const submittedPassword = body.password;

    if (!submittedPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Mot de passe manquant.' }),
      };
    }

    // 1. Récupérer le mot de passe en clair
    const { data: settings, error } = await supabase
        .from('settings')
        .select('admin_password')
        .eq('id', 1)
        .single();

    if (error) {
        throw new Error('Erreur de configuration serveur. (Vérifiez la ligne ID=1 dans la table settings)');
    }

    const storedPassword = settings.admin_password; // C'est le mot de passe en clair stocké

    if (!storedPassword) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Mot de passe non configuré. Veuillez contacter l\'administrateur.' }),
        };
    }

    // --- DANGER: COMPARISON EN CLAIR ---
    // 2. Comparer directement le mot de passe soumis avec le mot de passe stocké
    const isMatch = submittedPassword === storedPassword;
    // ---------------------------------


    if (!isMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Mot de passe incorrect.' }),
      };
    }

    // 3. Connexion réussie
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connexion réussie.' }),
    };

  } catch (error) {
    console.error('Erreur adminLogin:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'Erreur serveur lors de la connexion.' }),
    };
  }
};
