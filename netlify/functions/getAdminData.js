// netlify/functions/getAdminData.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // 1. Vérification de l'authentification
    const token = event.headers.cookie ? event.headers.cookie.split('; ').find(row => row.startsWith('admin_auth=')) : null;
    const ADMIN_TOKEN = 'VALID_ADMIN_SESSION_2024'; 
    
    if (!token || !token.includes(ADMIN_TOKEN)) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Accès refusé. Veuillez vous connecter.' }) };
    }
    
    try {
        // 2. Récupérer les settings
        const { data: settings, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 1)
          .single(); 

        if (settingsError) throw settingsError;

        // 3. Récupérer TOUTES les inscriptions (actives et supprimées)
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          // IMPORTANT : Inclure l'ID de la ligne et le statut de suppression
          .select('id, email, first_name, last_name, phone_number, is_deleted, created_at')
          .order('created_at', { ascending: true }); 

        if (regError) throw regError;

        // 4. Renvoie un objet contenant les deux sets de données
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              settings: settings, 
              registrations: registrations 
          }),
        };

      } catch (error) {
        console.error('Erreur getAdminData:', error);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: error.message || 'Erreur serveur interne.' }),
        };
      }
};
