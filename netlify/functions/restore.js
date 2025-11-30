// netlify/functions/restore.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const id = body.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID manquant.' }),
      };
    }

    const { error } = await supabase
      .from('registrations')
      .update({ is_deleted: false })
      .eq('id', id);

    if (error) {
      console.error('Erreur restore:', error);
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Utilisateur restauré avec succès.' }),
    };
  } catch (error) {
    console.error('Erreur restore (catch):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la restauration.' }),
    };
  }
};