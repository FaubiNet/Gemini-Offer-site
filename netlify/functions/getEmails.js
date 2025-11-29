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
    
    if (settingsError) {
        console.error('Erreur getEmails - settings:', settingsError);
        throw new Error('Erreur de connexion aux données. (Vérifiez la ligne ID=1 dans la table settings)');
    }

    // 2. Récupérer uniquement les inscriptions actives (is_deleted = false)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      // IMPORTANT : Inclure l'ID de la ligne
      .select('id, email, first_name, last_name, phone_number')
      .eq('is_deleted', false) // NOUVEAU: Ne récupérer que les enregistrements non supprimés
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message || 'Erreur serveur interne.' }),
    };
  }
};
