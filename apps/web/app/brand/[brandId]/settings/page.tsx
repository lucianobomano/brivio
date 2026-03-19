import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { updateBrand, deleteBrand } from "@/app/actions/brands"
import { Trash2, Save } from "lucide-react"

export default async function BrandSettingsPage({ params }: { params: { brandId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { brandId } = params

    const { data: brand, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

    if (error || !brand) {
        return <div>Brand not found</div>
    }

    async function updateAction(formData: FormData) {
        "use server"
        await updateBrand(formData)
    }

    async function deleteAction() {
        "use server"
        await deleteBrand(brandId)
    }

    return (
        <div className="min-h-screen bg-bg-0 text-white flex flex-col">
            <Navbar />
            <main className="flex-1 p-8 px-[55px]">
                <header className="mb-8 border-b border-bg-3 pb-6">
                    <h1 className="text-3xl font-bold mb-2">Brand Settings</h1>
                    <p className="text-text-secondary">Manage {brand.name} configuration and danger zone.</p>
                </header>

                <div className="max-w-2xl space-y-8">
                    {/* General Settings */}
                    <Card className="bg-bg-1 border-bg-3">
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Update your brand's core identity details.</CardDescription>
                        </CardHeader>
                        <form action={updateAction}>
                            <input type="hidden" name="brandId" value={brandId} />
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Brand Name</Label>
                                    <Input id="name" name="name" defaultValue={brand.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="primaryColor">Brand Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="primaryColor"
                                            name="primaryColor"
                                            type="color"
                                            defaultValue={brand.primary_color || '#6366f1'}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            disabled
                                            value="Pick a color"
                                            className="flex-1 bg-bg-2 border-transparent"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-bg-3 pt-6 flex justify-end">
                                <Button type="submit" className="bg-accent-indigo hover:bg-accent-indigo/90 text-white">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="bg-error/5 border-error/20">
                        <CardHeader>
                            <CardTitle className="text-error">Danger Zone</CardTitle>
                            <CardDescription className="text-error/80">Irreversible actions. Tread carefully.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-text-secondary mb-4">
                                Deleting this brand will remove all associated brandbooks, assets, and projects. This action cannot be undone.
                            </p>
                            <form action={deleteAction}>
                                <Button variant="destructive" className="bg-error hover:bg-error/90 text-white">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Brand
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
