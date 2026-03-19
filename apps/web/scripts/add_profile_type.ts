
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addColumn() {
    const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_type TEXT;"
    });

    if (error) {
        console.error("Error adding column:", error);
        // If RPC fails, maybe we can't do it this way.
    } else {
        console.log("Column profile_type added successfully");
    }
}

addColumn();
