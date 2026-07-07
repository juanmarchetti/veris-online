import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// simple parse of .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSignup() {
  console.log('Attempting signup...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_registro_diagnostic_no_existente@gmail.com',
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
    console.error('SIGNUP FAILED.');
    console.error('Error Object:', error);
    console.error('Error JSON:', JSON.stringify(error, null, 2));
    console.error('Error Message:', error.message);
  } else {
    console.log('SIGNUP SUCCESS.', data.user?.id);
  }
}

testSignup();
