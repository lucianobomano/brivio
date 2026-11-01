import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brivio — Brandbooks vivos, ficheiros e projetos de marca',
  description:
    'Cria brandbooks interativos a partir de templates, partilha-os por link e organiza os ficheiros e os projetos de cada marca num só sítio. Para freelancers, estúdios, agências e equipas de marca.',
}

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingPage />
}
