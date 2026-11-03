import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getInventory } from "@/app/actions/inventory"
import { InventoryClient } from "./InventoryClient"

export const metadata: Metadata = { title: "Inventário · Brivio" }

export default async function InventoryPage() {
    const data = await getInventory()
    if (!data) redirect('/onboarding')
    return <InventoryClient initial={data} />
}
