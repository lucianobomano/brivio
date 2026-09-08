"use client"

import React, { createContext, useContext } from "react"

export interface SectionContextValue {
    sectionId?: string
    backgroundColor?: string
}

export const SectionContext = createContext<SectionContextValue>({})

export const useSection = () => useContext(SectionContext)
