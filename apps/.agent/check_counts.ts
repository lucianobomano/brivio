import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCounts() {
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
      id,
      name,
      likes:project_likes(count),
      comments:project_comments(count)
    `)

    if (error) {
        console.error('Error fetching projects:', error)
        return
    }

    console.log('Projects Counts:')
    projects.forEach((p: any) => {
        console.log(`- ${p.name} (${p.id}):`)
        console.log(`  Likes: ${JSON.stringify(p.likes?.[0]?.count)}`)
        console.log(`  Comments: ${JSON.stringify(p.comments?.[0]?.count)}`)
    })
}

checkCounts()
