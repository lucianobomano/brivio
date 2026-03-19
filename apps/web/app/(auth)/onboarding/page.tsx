"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRight, Check, Building, Briefcase, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { completeOnboarding } from "@/app/actions/onboarding"

const steps = [
    { id: 1, title: "Workspace" },
    { id: 2, title: "First Brand" },
    { id: 3, title: "Complete" }
]

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = React.useState(1)
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    // Form State
    const [workspaceName, setWorkspaceName] = React.useState("")
    const [workspaceType, setWorkspaceType] = React.useState<'personal' | 'agency' | 'company'>('personal')
    const [brandName, setBrandName] = React.useState("")

    const totalSteps = steps.length

    async function handleFinish() {
        setLoading(true)
        const formData = new FormData()
        formData.append("workspaceName", workspaceName)
        formData.append("workspaceType", workspaceType)
        formData.append("brandName", brandName)

        try {
            await completeOnboarding(formData)
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

    return (
        <div className="min-h-screen bg-bg-0 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-accent-indigo/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-2xl z-10">
                {/* Progress */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={cn(
                                    "text-sm font-medium transition-colors duration-300",
                                    currentStep >= step.id ? "text-accent-indigo" : "text-bg-3"
                                )}
                            >
                                Step {step.id}: {step.title}
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-bg-2 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-accent-indigo"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                <Card className="bg-bg-1 border-bg-3 p-8 min-h-[400px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col space-y-6"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold">Name your Workspace</h1>
                                    <p className="text-text-secondary">This is your command center. You can create multiple workspaces later.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Workspace Name</Label>
                                        <Input
                                            placeholder="Acme Studio"
                                            value={workspaceName}
                                            onChange={(e) => setWorkspaceName(e.target.value)}
                                            className="text-lg py-6 bg-bg-0 border-bg-3"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="mb-2 block">Workspace Type</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <TypeButton
                                                active={workspaceType === 'personal'}
                                                onClick={() => setWorkspaceType('personal')}
                                                icon={User}
                                                label="Personal"
                                            />
                                            <TypeButton
                                                active={workspaceType === 'agency'}
                                                onClick={() => setWorkspaceType('agency')}
                                                icon={Briefcase}
                                                label="Agency"
                                            />
                                            <TypeButton
                                                active={workspaceType === 'company'}
                                                onClick={() => setWorkspaceType('company')}
                                                icon={Building}
                                                label="Company"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-end pt-8">
                                    <Button
                                        onClick={nextStep}
                                        disabled={!workspaceName.length}
                                        className="bg-accent-indigo hover:bg-accent-indigo/90 text-white min-w-[120px]"
                                    >
                                        Continue <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col space-y-6"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold">Setup your first Brand</h1>
                                    <p className="text-text-secondary">Add a brand you want to manage correctly from day one. You can skip this.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Brand Name</Label>
                                        <Input
                                            placeholder="My Awesome Brand"
                                            value={brandName}
                                            onChange={(e) => setBrandName(e.target.value)}
                                            className="text-lg py-6 bg-bg-0 border-bg-3"
                                        />
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-between pt-8">
                                    <Button variant="ghost" onClick={prevStep} className="text-text-secondary">Back</Button>
                                    <div className="space-x-4">
                                        <Button variant="ghost" onClick={nextStep} className="text-text-secondary hover:text-white">Skip for now</Button>
                                        <Button
                                            onClick={nextStep}
                                            disabled={!brandName.length}
                                            className="bg-accent-indigo hover:bg-accent-indigo/90 text-white min-w-[120px]"
                                        >
                                            Continue <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col items-center justify-center space-y-6 text-center"
                            >
                                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center text-success mb-4">
                                    <Check className="w-10 h-10" />
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold">You're all set!</h1>
                                    <p className="text-text-secondary">
                                        We've prepared your workspace <strong>{workspaceName}</strong>.
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <Button
                                        size="lg"
                                        onClick={handleFinish}
                                        disabled={loading}
                                        className="bg-accent-indigo hover:bg-accent-indigo/90 text-white min-w-[200px] h-12"
                                    >
                                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Enter Dashboard"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    )
}

function TypeButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200",
                active
                    ? "bg-bg-2 border-accent-indigo ring-1 ring-accent-indigo/50 text-white"
                    : "bg-bg-0 border-bg-3 text-text-secondary hover:bg-bg-2 hover:text-white"
            )}
        >
            <Icon className={cn("w-6 h-6 mb-2", active ? "text-accent-indigo" : "currentColor")} />
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}
