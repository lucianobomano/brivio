import { Metadata } from 'next'
import { Suspense } from 'react'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
    title: 'Checkout | Brivio',
    description: 'Finalize a sua subscrição e faça o upload do comprovativo.',
}

export default function CheckoutPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">A carregar detalhes da subscrição...</div>}>
                <CheckoutClient />
            </Suspense>
        </main>
    )
}
