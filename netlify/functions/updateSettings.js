// netlify/functions/updateSettings.js
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

    // Champs autorisés
    const allowedFields = [
      'title_text',
      'subtitle_text',
      'button_text',
      'status_title',
      'status_text_tpl',
      'remaining_text_tpl',
      'list_title',
      'limit_title',
      'limit_message',
      'max_users',
      'registration_open',
      'require_first_name',
      'require_last_name',
      'require_phone',
      'admin_password',
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Aucun paramètre à mettre à jour.' }),
      };
    }

    const { error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', 1);

    if (error) {
      console.error('Erreur updateSettings:', error);
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Paramètres mis à jour avec succès.' }),
    };
  } catch (error) {
    console.error('Erreur updateSettings (catch):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || 'Erreur serveur lors de la mise à jour des paramètres.',
      }),
    };
  }
};