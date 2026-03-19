"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type DocumentType = 'invoice' | 'receipt' | 'billing'

export interface FinancialDocument {
    id: string
    project_id: string
    identifier: string
    amount: number
    currency: string
    status: string
    issued_at?: string
    due_date?: string
    received_at?: string
    content: any
    type: DocumentType
    client_name?: string
    client_email?: string
    payment_method?: string
    items?: any[]
}

export async function getDocumentsByProject(projectId: string, type: DocumentType) {
    const supabase = await createClient()
    const table = type === 'invoice' ? 'invoices' : type === 'receipt' ? 'receipts' : 'project_billings'

    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('project_id', projectId)
        .order(type === 'receipt' ? 'received_at' : 'issued_at', { ascending: false })

    if (error) {
        console.error(`Error fetching ${type} documents:`, error)
        return []
    }

    return data.map(doc => ({ ...doc, type }))
}

export async function createDocument(type: DocumentType, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const table = type === 'invoice' ? 'invoices' : type === 'receipt' ? 'receipts' : 'project_billings'

    // Separate items from the rest of the data to avoid inserting into the main table
    const { items, ...insertData } = data

    const { data: document, error } = await supabase
        .from(table)
        .insert({
            ...insertData,
            issued_at: insertData.issued_at || new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error(`Error creating ${type}:`, error)
        return { success: false, error: error.message }
    }

    // If invoice, create items
    if (type === 'invoice' && items && items.length > 0) {
        const invoiceItems = items.map((item: any) => ({
            invoice_id: document.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
        }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems)
        if (itemsError) {
            console.error("Error creating invoice items:", itemsError)
            return { success: false, error: "Fatura criada, mas erro ao salvar itens: " + itemsError.message }
        }
    }

    revalidatePath('/projects')
    return { success: true, document: { ...document, type } }
}

export async function updateDocument(id: string, type: DocumentType, data: any) {
    const supabase = await createClient()
    const table = type === 'invoice' ? 'invoices' : type === 'receipt' ? 'receipts' : 'project_billings'

    // Separate items from the rest of the data
    const { items, ...updateData } = data

    const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error(`Error updating ${type}:`, error)
        return { success: false, error: error.message }
    }

    // Update items if invoice
    if (type === 'invoice' && items) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id)
        const updateItems = items.map((item: any) => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
        }))
        await supabase.from('invoice_items').insert(updateItems)
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function deleteDocument(id: string, type: DocumentType) {
    const supabase = await createClient()
    const table = type === 'invoice' ? 'invoices' : type === 'receipt' ? 'receipts' : 'project_billings'

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

    if (error) {
        console.error(`Error deleting ${type}:`, error)
        return { success: false, error: error.message }
    }

    revalidatePath('/projects')
    return { success: true }
}

export async function getDocumentTemplates(type?: DocumentType) {
    const supabase = await createClient()
    let query = supabase.from('document_templates').select('*')
    if (type) query = query.eq('type', type)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
        console.error("Error fetching templates:", error)
        return []
    }
    return data
}

export async function saveDocumentTemplate(name: string, type: DocumentType, content: any) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('document_templates')
        .insert({ name, type, content })
        .select()
        .single()

    if (error) {
        console.error("Error saving template:", error)
        return { success: false, error: error.message }
    }
    return { success: true, template: data }
}
export async function deleteDocumentTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error deleting template:", error)
        return { success: false, error: error.message }
    }
    return { success: true }
}
