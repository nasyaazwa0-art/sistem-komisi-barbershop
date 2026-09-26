const SUPABASE_URL = "https://xcumpkpmkyilxydftpwf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Fbru1ZTgU6Hf5D62UmOd1Q_6_MIum5I";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.db = db;

console.log("Supabase client berhasil dibuat.");