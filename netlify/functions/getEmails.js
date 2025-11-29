// netlify/functions/getEmails.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  try {
    // 1. Settings
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (settingsError) throw new Error('Erreur settings.');

    // 2. Inscriptions (Seulement les actives)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, email, first_name, last_name, phone_number, created_at') 
      .eq('status', 'active') // FILTRE IMPORTANT
      .order('created_at', { ascending: true });

    if (regError) throw regError;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, registrations }),
    };

  } catch (error) {
    console.error('Erreur getEmails:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erreur récupération données." }),
    };
  }
};
