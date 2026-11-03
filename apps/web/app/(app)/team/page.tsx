import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTeam } from "@/app/actions/team"
import { TeamClient } from "./TeamClient"

export const metadata: Metadata = { title: "Equipa · Brivio" }

export default async function TeamPage() {
    const team = await getTeam()
    if (!team) redirect('/onboarding')
    return <TeamClient initial={team} />
}
