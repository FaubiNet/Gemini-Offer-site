// netlify/functions/adminLogin.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); // Nécessite npm install bcryptjs

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
    
    // 1. Récupérer le hash du mot de passe admin
    const { data: settings, error } = await supabase
        .from('settings')
        .select('admin_password')
        .eq('id', 1)
        .single();
    
    if (error) {
        // Gérer l'erreur si la ligne settings ID=1 n'existe pas
        throw new Error('Erreur de configuration serveur.'); 
    }
    
    const passwordHash = settings.admin_password;

    if (!passwordHash) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Mot de passe non configuré. Veuillez contacter l\'administrateur.' }),
        };
    }

    // 2. Comparer le mot de passe soumis avec le hash stocké
    const isMatch = await bcrypt.compare(submittedPassword, passwordHash);

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
