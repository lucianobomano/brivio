"use client"

import React from "react"
import { LeftSidebar } from "./LeftSidebar"
import { MainCanvas } from "./MainCanvas"
import { RightSidebar } from "./RightSidebar"

interface BrandbookLayoutProps {
    children?: React.ReactNode // In case we need to inject content, though mostly it manages itself
}

export function BrandbookLayout({ children }: BrandbookLayoutProps) {
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-bg-2">
            <LeftSidebar />
            <MainCanvas />
            <RightSidebar />
        </div>
    )
}
