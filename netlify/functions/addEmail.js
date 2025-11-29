const { createClient } = require('@supabase/supabase-js');

// On récupère les variables d'environnement (configurées dans Netlify)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_USERS = 5;

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const email = (body.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email invalide.' }) };
    }

    // 1. Vérifier le nombre actuel d'inscrits
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count >= MAX_USERS) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Désolé, les 5 places sont prises !' }),
      };
    }

    // 2. Vérifier si l'email existe déjà
    const { data: existingUser } = await supabase
      .from('registrations')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Cet email est déjà inscrit.' }),
      };
    }

    // 3. Ajouter l'email
    const { error: insertError } = await supabase
      .from('registrations')
      .insert([{ email: email }]);

    if (insertError) throw insertError;

    // 4. Récupérer la liste mise à jour pour le frontend
    const { data: allUsers } = await supabase
      .from('registrations')
      .select('email');
    
    // On transforme le format [{email: 'a'}, {email: 'b'}] en ['a', 'b'] pour ton front
    const emailList = allUsers.map(u => u.email);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Félicitations ! Votre place est réservée.',
        data: { emails: emailList } // On garde le format attendu par ton JS
      }),
    };

  } catch (error) {
    console.error('Erreur addEmail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur serveur.' }),
    };
  }
};
