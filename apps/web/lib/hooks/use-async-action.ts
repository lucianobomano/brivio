"use client"

import * as React from "react"

/**
 * Wraps an async handler with a pending flag and a re-entry guard,
 * so buttons can show a spinner and repeated clicks don't fire the action twice.
 *
 *   const [deleteSprint, isDeleting] = useAsyncAction(async (id: string) => { ... })
 *   <Button loading={isDeleting} onClick={() => deleteSprint(id)}>Eliminar</Button>
 */
export function useAsyncAction<Args extends unknown[], R>(
    action: (...args: Args) => Promise<R>
): [(...args: Args) => Promise<R | undefined>, boolean] {
    const [isPending, setIsPending] = React.useState(false)
    const runningRef = React.useRef(false)
    const actionRef = React.useRef(action)
    actionRef.current = action

    const run = React.useCallback(async (...args: Args) => {
        if (runningRef.current) return undefined
        runningRef.current = true
        setIsPending(true)
        try {
            return await actionRef.current(...args)
        } finally {
            runningRef.current = false
            setIsPending(false)
        }
    }, [])

    return [run, isPending]
}
