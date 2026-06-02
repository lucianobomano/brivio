import { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
    title: 'Preços | Brivio',
    description: 'Escolha o plano perfeito para si ou para a sua equipa.',
}

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <PricingClient />
        </main>
    )
}
