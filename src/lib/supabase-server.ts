import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client ANON: pour l'auth des utilisateurs (inscription, connexion)
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)

// Client ADMIN: pour les opérations serveur (créer agents, vérifier tokens)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)
