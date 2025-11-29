// netlify/functions/addEmail.js
const { createClient } = require('@supabase/supabase-js');

// Les variables d'environnement sont lues par Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // 1. Lire les paramètres dynamiques (Limite, Texte, Champs Requis)
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (settingsError) {
        console.error('Erreur lecture settings:', settingsError);
        throw new Error('Erreur de configuration serveur.');
    }

    // Vérification de l'ouverture des inscriptions
    if (!settings || !settings.registration_open) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Désolé, les inscriptions sont actuellement fermées.' }),
        };
    }
    
    const MAX_USERS = settings.max_users || 5;
    const registrationData = { email: email };

    // 2. Validation de l'email
    if (!isValidEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email invalide.' }) };
    }

    // 3. Validation et ajout des champs optionnels/requis
    if (settings.require_first_name) {
        if (!body.first_name || body.first_name.trim() === '') {
            return { statusCode: 400, body: JSON.stringify({ message: 'Le prénom est requis.' }) };
        }
        registrationData.first_name = body.first_name.trim();
    }
    if (settings.require_last_name) {
        if (!body.last_name || body.last_name.trim() === '') {
            return { statusCode: 400, body: JSON.stringify({ message: 'Le nom est requis.' }) };
        }
        registrationData.last_name = body.last_name.trim();
    }
    if (settings.require_phone) {
        if (!body.phone_number || body.phone_number.trim() === '') {
            return { statusCode: 400, body: JSON.stringify({ message: 'Le numéro de téléphone est requis.' }) };
        }
        registrationData.phone_number = body.phone_number.trim();
    }

    // 4. Vérifier le nombre actuel d'inscrits
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count >= MAX_USERS) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: `Désolé, les ${MAX_USERS} places sont prises !` }),
      };
    }

    // 5. Vérifier si l'email existe déjà
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

    // 6. Ajouter l'inscription
    const { error: insertError } = await supabase
      .from('registrations')
      .insert([registrationData]);

    if (insertError) throw insertError;

    // 7. Succès (Le frontend rechargera les données)
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Félicitations ! Votre place est réservée.',
        // On n'envoie plus la liste des emails, le front fait un nouvel appel getEmails
      }),
    };

  } catch (error) {
    console.error('Erreur addEmail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur serveur interne.' }),
    };
  }
};
