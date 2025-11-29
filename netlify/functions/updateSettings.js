// netlify/functions/updateSettings.js
const { createClient } = require('@supabase/supabase-js');

// La dépendance bcryptjs n'est plus nécessaire

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const updateData = { ...body };
    
    // --- DANGER: STOCKAGE EN CLAIR ---
    // Si updateData.admin_password est fourni, il est stocké en clair.
    if (!updateData.admin_password) {
        // Si le champ est vide, on le retire de la mise à jour pour conserver l'ancien mot de passe
        delete updateData.admin_password;
    }
    // ---------------------------------


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
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la mise à jour des paramètres.' }),
    };
  }
};
