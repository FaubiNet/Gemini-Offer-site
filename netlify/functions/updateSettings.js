// netlify/functions/updateSettings.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); // NOUVEAU

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // Vérification d'authentification simple via le cookie
  const token = event.headers.cookie ? event.headers.cookie.split('; ').find(row => row.startsWith('admin_auth=')) : null;
  const ADMIN_TOKEN = 'VALID_ADMIN_SESSION_2024'; 
  
  let body = JSON.parse(event.body || '{}');
  
  // Si le token n'est pas valide ET que l'on ne change pas le mot de passe (première configuration)
  if ((!token || !token.includes(ADMIN_TOKEN)) && !body.admin_password) {
      // On refuse l'accès, sauf si c'est la première fois qu'on envoie un mot de passe.
      return { statusCode: 403, body: JSON.stringify({ message: 'Accès refusé. Veuillez vous connecter.' }) };
  }
  
  try {
    // Hachage du mot de passe s'il est fourni (uniquement lors d'un changement)
    if (body.admin_password) {
        // Hacher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        body.admin_password = await bcrypt.hash(body.admin_password, salt);
    }
    
    // Mettre à jour l'unique ligne avec ID=1
    const { data, error } = await supabase
      .from('settings')
      .update(body)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Paramètres mis à jour avec succès.', settings: data }),
    };

  } catch (error) {
    console.error('Erreur updateSettings:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la mise à jour des paramètres.' }),
    };
  }
};
