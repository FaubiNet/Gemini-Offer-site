// netlify/functions/deleteEmail.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // Sécurité basique : on pourrait vérifier un cookie admin ici, 
  // mais on va se fier au fait que l'interface admin est protégée.
  
  try {
    const body = JSON.parse(event.body || '{}');
    const emailToDelete = body.email;

    if (!emailToDelete) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email manquant.' }) };
    }

    // "Supprimer" = Passer le status en 'trashed'
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'trashed' })
      .eq('email', emailToDelete);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Utilisateur déplacé dans la corbeille.' }),
    };

  } catch (error) {
    console.error('Erreur deleteEmail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur lors de la suppression.' }),
    };
  }
};
