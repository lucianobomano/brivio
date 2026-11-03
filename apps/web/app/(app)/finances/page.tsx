import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getFinances } from "@/app/actions/finances"
import { FinancesClient } from "./FinancesClient"

export const metadata: Metadata = { title: "Finanças · Brivio" }

export default async function FinancesPage() {
    const data = await getFinances()
    if (!data) redirect('/onboarding')
    return <FinancesClient data={data} />
}
