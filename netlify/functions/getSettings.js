// netlify/functions/getSettings.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single(); // Récupère la ligne unique de paramètres

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    };

  } catch (error) {
    console.error('Erreur getSettings:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la récupération des paramètres.' }),
    };
  }
};
