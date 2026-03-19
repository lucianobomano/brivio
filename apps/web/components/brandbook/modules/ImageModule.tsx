"use client"

import React, { useState } from "react"
import { BaseModule } from "./BaseModule"
import { updateModuleContent, deleteModule } from "@/app/actions/brandbook"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon, X } from "lucide-react"

interface ImageModuleProps {
    moduleId: string
    content: any
    isReadOnly?: boolean
    onDelete?: () => void
}

export function ImageModule({ moduleId, content, isReadOnly, onDelete }: ImageModuleProps) {
    const [imageUrl, setImageUrl] = useState(content?.url || "")
    const [caption, setCaption] = useState(content?.caption || "")
    const [isEditing, setIsEditing] = useState(!content?.url)

    const handleSave = async () => {
        setIsEditing(false)
        await updateModuleContent(moduleId, { url: imageUrl, caption })
    }

    const handleBlur = () => {
        updateModuleContent(moduleId, { url: imageUrl, caption })
    }

    // This is a simplified image input (URL only) for now. 
    // Ideally, this should integrate with an Asset Picker or File Upload.

    return (
        <BaseModule
            title="Image"
            icon={ImageIcon}
            isReadOnly={isReadOnly}
            onDelete={onDelete}
        >
            <div className="space-y-4">
                {isEditing && !isReadOnly ? (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                        <div className="grid gap-2">
                            <Label htmlFor={`url-${moduleId}`}>Image URL</Label>
                            <Input
                                id={`url-${moduleId}`}
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`caption-${moduleId}`}>Caption</Label>
                            <Input
                                id={`caption-${moduleId}`}
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Enter caption..."
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                ) : (
                    <div className="relative group">
                        {imageUrl ? (
                            <figure>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt={caption || "Brand asset"}
                                    className="w-full h-auto rounded-lg border border-border"
                                />
                                {caption && (
                                    <figcaption className="mt-2 text-sm text-center text-muted-foreground">
                                        {caption}
                                    </figcaption>
                                )}
                            </figure>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-muted rounded-lg">
                                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">No image selected</span>
                            </div>
                        )}

                        {!isReadOnly && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </BaseModule>
    )
}
