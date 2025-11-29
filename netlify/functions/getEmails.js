// netlify/functions/getEmails.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  try {
    // 1. Récupérer les paramètres (settings)
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (settingsError) throw settingsError;

    // 2. Récupérer toutes les inscriptions
    // On sélectionne tous les champs pour le dashboard admin
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('email, first_name, last_name, phone_number') 
      .order('created_at', { ascending: true });

    if (regError) throw regError;

    // 3. Renvoie un objet contenant les deux sets de données
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          settings: settings, 
          registrations: registrations 
      }),
    };

  } catch (error) {
    console.error('Erreur getEmails:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erreur lors de la récupération des données." }),
    };
  }
};
