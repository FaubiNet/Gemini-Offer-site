// netlify/functions/updateRegistrationStatus.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // 1. Vérification de l'authentification (doit être fait ici aussi)
  const token = event.headers.cookie ? event.headers.cookie.split('; ').find(row => row.startsWith('admin_auth=')) : null;
  const ADMIN_TOKEN = 'VALID_ADMIN_SESSION_2024';
  
  if (!token || !token.includes(ADMIN_TOKEN)) {
      return { statusCode: 403, body: JSON.stringify({ message: 'Accès refusé.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { id, action } = body;

    if (!id || !action) {
      return { statusCode: 400, body: JSON.stringify({ message: 'ID de l\'inscription ou action manquant.' }) };
    }
    
    let result;
    let successMessage;

    switch (action) {
      case 'soft-delete': // Mettre à la corbeille
        result = await supabase
          .from('registrations')
          .update({ is_deleted: true })
          .eq('id', id);
        successMessage = 'Inscription déplacée vers la corbeille.';
        break;

      case 'restore': // Restaurer
        result = await supabase
          .from('registrations')
          .update({ is_deleted: false })
          .eq('id', id);
        successMessage = 'Inscription restaurée avec succès.';
        break;

      case 'hard-delete': // Suppression définitive
        result = await supabase
          .from('registrations')
          .delete()
          .eq('id', id);
        successMessage = 'Inscription supprimée définitivement.';
        break;

      default:
        return { statusCode: 400, body: JSON.stringify({ message: 'Action invalide.' }) };
    }

    if (result.error) throw result.error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: successMessage }),
    };

  } catch (error) {
    console.error('Erreur updateRegistrationStatus:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message || 'Erreur serveur interne.' }),
    };
  }
};
