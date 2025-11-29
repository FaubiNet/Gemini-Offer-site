// netlify/functions/getSettings.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // 1. Vérification de l'authentification via le cookie
    const token = event.headers.cookie ? event.headers.cookie.split('; ').find(row => row.startsWith('admin_auth=')) : null;
    const ADMIN_TOKEN = 'VALID_ADMIN_SESSION_2024'; 
    
    // Si le cookie n'est pas présent ou invalide, on refuse.
    if (!token || !token.includes(ADMIN_TOKEN)) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Accès refusé. Veuillez vous connecter.' }) };
    }
    
    try {
        // 2. Récupère la ligne unique de paramètres
        const { data: settings, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 1)
          .single(); 

        if (error) throw error;

        // 3. Ne renvoie que les settings (le getEmails donnera les inscriptions)
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
