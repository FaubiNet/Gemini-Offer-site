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

    // 1. Lire les paramètres
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError) {
      console.error('Erreur addEmail - settings:', settingsError);
      throw new Error('Erreur configuration settings (ID=1).');
    }

    const MAX_USERS = settings.max_users || 5;

    // 2. Vérifier si les inscriptions sont ouvertes
    if (!settings.registration_open) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: settings.limit_message || 'Inscriptions fermées.',
        }),
      };
    }

    // 3. Normaliser et valider l'email
    const email = (body.email || '').toString().trim().toLowerCase();
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email manquant.' }),
      };
    }

    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email invalide.' }),
      };
    }

    // Données d'inscription : on force is_deleted = false
    const registrationData = { email, is_deleted: false };

    // 4. Champs supplémentaires conditionnels
    if (settings.require_first_name) {
      if (!body.first_name?.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Prénom requis.' }),
        };
      }
      registrationData.first_name = body.first_name.trim();
    }

    if (settings.require_last_name) {
      if (!body.last_name?.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Nom requis.' }),
        };
      }
      registrationData.last_name = body.last_name.trim();
    }

    if (settings.require_phone) {
      if (!body.phone_number?.trim()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Téléphone requis.' }),
        };
      }
      registrationData.phone_number = body.phone_number.trim();
    }

    // 5. Vérifier si l'email existe déjà (actif ou corbeille)
    const { data: existingUser, error: existingError } = await supabase
      .from('registrations')
      .select('email, is_deleted')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Erreur addEmail - existingUser:', existingError);
      throw existingError;
    }

    if (existingUser) {
      if (existingUser.is_deleted) {
        // Email déjà passé dans la corbeille : a déjà bénéficié de l'offre
        return {
          statusCode: 409,
          body: JSON.stringify({
            message:
              "Cet email a déjà bénéficié de cette offre. Vérifiez vos messages ou contactez l'équipe Hackers Academy X.",
          }),
        };
      }

      // Email encore actif
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Cet email est déjà inscrit.' }),
      };
    }

    // 6. Vérifier le nombre actuel d'inscrits ACTIFS uniquement
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (countError) {
      console.error('Erreur addEmail - count:', countError);
      throw countError;
    }

    if (typeof count === 'number' && count >= MAX_USERS) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message:
            settings.limit_message || `Désolé, les ${MAX_USERS} places sont prises !`,
        }),
      };
    }

    // 7. Insérer la nouvelle inscription
    const { error: insertError } = await supabase
      .from('registrations')
      .insert([registrationData]);

    if (insertError) {
      console.error('Erreur addEmail - insert:', insertError);
      throw insertError;
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Félicitations ! Votre place est réservée.',
      }),
    };
  } catch (error) {
    console.error('Erreur addEmail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || 'Erreur serveur.',
      }),
    };
  }
};