// netlify/functions/updateSettings.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    let updateData = { ...body };
    
    // --- Début du filtrage de sécurité (à supprimer après la mise à jour BDD) ---
    // CORRECTION CRITIQUE: Filtrage des clés pour éviter l'erreur Supabase PGRST204 
    // si les nouvelles colonnes n'existent pas encore dans la base de données.
    // Clés standard qui DOIVENT exister :
    const safeKeys = [
        'title_text', 'button_text', 'max_users', 'registration_open', 
        'require_first_name', 'require_last_name', 'require_phone', 'admin_password',
        
        // Clés qui doivent être ajoutées manuellement dans Supabase (type text)
        'status_title', 'status_text', 'limit_title', 'limit_message' 
    ];

    const finalUpdateData = {};
    for (const key in updateData) {
        if (safeKeys.includes(key)) {
            finalUpdateData[key] = updateData[key];
        }
    }
    updateData = finalUpdateData;

    if (Object.keys(updateData).length === 0) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ message: 'Aucun paramètre valide à mettre à jour. Veuillez vérifier vos entrées.' }) 
        };
    }
    // --- Fin du filtrage de sécurité ---


    // Gérer le mot de passe
    if (!updateData.admin_password) {
        delete updateData.admin_password;
    }
    
    // 2. Mettre à jour la ligne unique avec ID=1
    const { data, error } = await supabase
      .from('settings')
      .update(updateData)
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
    // Renvoie un message plus clair à l'Admin
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Erreur serveur: La colonne est manquante ou le format est invalide. (Vérifiez votre BDD pour les colonnes status_text, limit_title, etc.)` }),
    };
  }
};
