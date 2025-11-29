// netlify/functions/updateSettings.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); // Nécessite npm install bcryptjs

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
    
    // 1. Gérer le hachage du mot de passe
    if (updateData.admin_password) {
        // Hacher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(updateData.admin_password, salt);
        updateData.admin_password = hash; // Stocker le hash
    } else {
        // Si le champ est vide, on le retire de la mise à jour pour conserver le hash existant
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
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la mise à jour des paramètres.' }),
    };
  }
};
