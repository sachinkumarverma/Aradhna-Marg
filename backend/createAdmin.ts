import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdmin() {
  const email = 'admin@aradhnamarg.com';
  const password = process.env.ADMIN_PASSWORD || 'Skverma@2001';

  console.log('Creating admin user:', email);
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('Successfully created admin user!');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createAdmin();
