// netlify/functions/adminLogin.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); // Package nécessaire pour le hachage

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Un token simple pour l'authentification côté client (le backend se fie au hachage)
const ADMIN_TOKEN = 'VALID_ADMIN_SESSION_2024'; 

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const password = body.password;
        
        if (!password) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Mot de passe manquant.' }) };
        }

        // 1. Récupérer le mot de passe haché depuis la DB (ligne ID=1)
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('admin_password')
            .eq('id', 1)
            .single();

        if (settingsError) throw settingsError;

        const hashedPassword = settings.admin_password;

        if (!hashedPassword || hashedPassword === '') {
            // C'est la première connexion, ou le mot de passe n'est pas configuré
            // On refuse par sécurité. L'admin doit d'abord sauvegarder un mot de passe.
             return { statusCode: 401, body: JSON.stringify({ message: 'Accès restreint. Configurez d\'abord un mot de passe via l\'administration.' }) };
        }


        // 2. Comparer le mot de passe fourni avec le haché
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (isMatch) {
            return { 
                statusCode: 200, 
                body: JSON.stringify({ 
                    message: 'Connexion réussie',
                    token: ADMIN_TOKEN 
                }) 
            };
        } else {
            return { statusCode: 401, body: JSON.stringify({ message: 'Mot de passe incorrect.' }) };
        }

    } catch (error) {
        console.error('Erreur adminLogin:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erreur serveur lors de la connexion.' }),
        };
    }
};
