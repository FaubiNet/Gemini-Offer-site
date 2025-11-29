// netlify/functions/updateSettings.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // NOTE: En production, il faudrait ajouter une AUTHENTIFICATION pour l'admin !
  // Pour ce tutoriel, nous nous contenterons de la clé secrète du serveur Netlify.

  try {
    const body = JSON.parse(event.body || '{}');
    // On met à jour l'unique ligne avec ID=1
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
