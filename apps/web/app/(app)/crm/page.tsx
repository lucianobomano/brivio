import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCrmData } from "@/app/actions/crm"
import { CrmClient } from "./CrmClient"

export const metadata: Metadata = { title: "CRM · Brivio" }

export default async function CrmPage() {
    const data = await getCrmData()
    if (!data) redirect('/onboarding')
    return <CrmClient initial={data} />
}
