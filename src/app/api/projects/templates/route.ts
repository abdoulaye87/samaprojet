import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

// Project templates — static data
const TEMPLATES = [
  { name: 'Boutique à Sandaga', category: 'commerce', recommendedBudget: 500000, monthlyRevenue: 120000, monthlyExpense: 75000, description: 'Tenu de vêtements et accessoires au marché de Sandaga.' },
  { name: 'Élevage de poulets à Thiès', category: 'elevage', recommendedBudget: 1000000, monthlyRevenue: 250000, monthlyExpense: 150000, description: 'Ferme avicole moderne avec 500 poules pondeuses.' },
  { name: 'Transport inter-villes', category: 'transport', recommendedBudget: 2000000, monthlyRevenue: 500000, monthlyExpense: 320000, description: 'Service de minibus entre Dakar et Saint-Louis.' },
  { name: 'Agriculture Vallée du Fleuve', category: 'agriculture', recommendedBudget: 3000000, monthlyRevenue: 700000, monthlyExpense: 400000, description: 'Riziculture irriguée dans la vallée du Sénégal.' },
  { name: 'Cyber café à Pikine', category: 'technologie', recommendedBudget: 500000, monthlyRevenue: 130000, monthlyExpense: 65000, description: 'Cyber café avec 20 postes et services administratifs.' },
  { name: 'BTP à Diamniadio', category: 'immobilier', recommendedBudget: 5000000, monthlyRevenue: 1200000, monthlyExpense: 800000, description: 'Entreprise de construction à Diamniadio.' },
]

export async function GET() {
  return NextResponse.json({ templates: TEMPLATES })
}
