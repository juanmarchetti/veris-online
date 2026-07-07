import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log("Attempting signup...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test_registro_diagnostic@gmail.com',
    password: 'password123',
    options: {
      data: {
        tipo_identificacion: 'CEDULA',
        numero_identificacion: '0999999999',
        nombre_completo: 'Test User',
        telefono: '0999999999'
      }
    }
  });

  if (error) {
    console.error("SIGNUP FAILED.");
    console.error("Error Object:", error);
    console.error("Error JSON:", JSON.stringify(error, null, 2));
    console.error("Error Message:", error.message);
    console.error("Error Name:", error.name);
  } else {
    console.log("SIGNUP SUCCESS.");
    console.log("User:", data.user?.id);
    
    // Cleanup if success
    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    await adminSupabase.auth.admin.deleteUser(data.user!.id);
    console.log("Test user cleaned up.");
  }
}

testSignup();
