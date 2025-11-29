const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  try {
    // Récupérer tous les emails
    const { data, error } = await supabase
      .from('registrations')
      .select('email')
      .order('created_at', { ascending: true }); // Trier par date d'inscription

    if (error) throw error;

    // Transformer le tableau d'objets en tableau de strings simple
    // Ex: [{email: "x@x.com"}, {email: "y@y.com"}] -> ["x@x.com", "y@y.com"]
    const emails = data.map(row => row.email);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: emails }),
    };

  } catch (error) {
    console.error('Erreur getEmails:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erreur lors de la récupération des données." }),
    };
  }
};
