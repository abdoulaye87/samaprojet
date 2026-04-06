import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client ANON — utilisé pour :
// - signUp / signInWithPassword (auth utilisateur)
// - getUser(token) (vérification de token)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client ADMIN (service_role) — utilisé pour :
// - auto-confirmer les emails
// - opérations admin bypassant RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

/**
 * Confirme automatiquement l'email d'un utilisateur via l'Admin API.
 * Permet de contourner le paramètre "Confirm email" de Supabase.
 * Retourne false si la clé service_role n'est pas configurée.
 */
export async function confirmUserEmail(userId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY non configurée — auto-confirmation désactivée')
    return false
  }
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })
    if (error) {
      console.error('Auto-confirm error:', error.message)
      return false
    }
    console.log(`[supabase] Email auto-confirmed pour user ${userId}`)
    return true
  } catch (err) {
    console.error('Auto-confirm exception:', err)
    return false
  }
}
