import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client UNIQUE avec anon key — utilisé pour TOUT :
// - signUp / signInWithPassword (auth utilisateur)
// - getUser(token) (vérification de token)
// - signOut({ token }) (déconnexion spécifique)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
