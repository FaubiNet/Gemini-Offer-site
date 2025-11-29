// netlify/functions/addEmail.js
const { createClient } = require('@supabase/supabase-js');

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
    
    // 1. Lire les paramètres
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
    
    if (settingsError) throw new Error('Erreur configuration settings (ID=1).');

    const MAX_USERS = settings.max_users || 5;

    if (!settings.registration_open) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: settings.limit_message || 'Inscriptions fermées.' }),
        };
    }
    
    // 2. Validation Email
    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email invalide.' }),
      };
    }
    
    // 3. Champs requis
    const registrationData = { email: email, status: 'active' }; // Force le statut active
    
    if (settings.require_first_name) {
        if (!body.first_name?.trim()) return { statusCode: 400, body: JSON.stringify({ message: 'Prénom requis.' }) };
        registrationData.first_name = body.first_name.trim();
    }
    if (settings.require_last_name) {
        if (!body.last_name?.trim()) return { statusCode: 400, body: JSON.stringify({ message: 'Nom requis.' }) };
        registrationData.last_name = body.last_name.trim();
    }
    if (settings.require_phone) {
        if (!body.phone_number?.trim()) return { statusCode: 400, body: JSON.stringify({ message: 'Téléphone requis.' }) };
        registrationData.phone_number = body.phone_number.trim();
    }

    // 4. Vérifier si l'email existe déjà (Active ou Trash)
    const { data: existingUser } = await supabase
      .from('registrations')
      .select('email, status')
      .eq('email', email)
      .maybeSingle(); // maybeSingle évite une erreur si pas trouvé

    if (existingUser) {
      // LOGIQUE SPECIFIQUE DEMANDÉE
      if (existingUser.status === 'trashed') {
          return {
              statusCode: 409, // Conflict
              body: JSON.stringify({ message: "Cet email a déjà bénéficié de cette offre. Vérifiez vos messages mail ou contactez l'équipe Hackers Academy X." }),
          };
      } else {
          return {
            statusCode: 409,
            body: JSON.stringify({ message: 'Cet email est déjà inscrit.' }),
          };
      }
    }

    // 5. Vérifier le nombre actuel d'inscrits ACTIFS seulement
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'); // On ne compte que les actifs

    if (countError) throw countError;

    if (count >= MAX_USERS) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: settings.limit_message || `Désolé, les ${MAX_USERS} places sont prises !` }),
      };
    }

    // 6. Ajouter l'inscription
    const { error: insertError } = await supabase
      .from('registrations')
      .insert([registrationData]);

    if (insertError) throw insertError;

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Félicitations ! Votre place est réservée.' }),
    };

  } catch (error) {
    console.error('Erreur addEmail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'Erreur serveur.' }),
    };
  }
};
