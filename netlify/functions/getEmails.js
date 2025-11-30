// netlify/functions/getEmails.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  try {
    // 1. Charger les paramètres (settings)
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError) {
      console.error('Erreur getEmails - settings:', settingsError);
      throw new Error('Erreur configuration settings (ID=1).');
    }

    // 2. Charger toutes les inscriptions (actives + corbeille)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, email, first_name, last_name, phone_number, is_deleted, created_at')
      .order('created_at', { ascending: true });

    if (regError) {
      console.error('Erreur getEmails - registrations:', regError);
      throw regError;
    }

    // 3. Retourner settings + toutes les inscriptions
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings,
        registrations: registrations || [],
      }),
    };
  } catch (error) {
    console.error('Erreur getEmails:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Erreur interne du serveur lors de la récupération des emails.',
      }),
    };
  }
};