import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { email, password, full_name, role, tenant_id } = await request.json();

    if (!email || !password || !full_name || !tenant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Ensure tenant record exists first to satisfy foreign key constraint
    const { error: tenantError } = await supabaseAdmin
      .from('tenants')
      .upsert({ id: tenant_id }, { onConflict: 'id' });

    if (tenantError) {
      console.error('Tenant upsert error:', tenantError);
    }

    // 2. Create User in Auth using Service Role Key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 3. Upsert into profiles table
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([
      {
        id: userId,
        tenant_id,
        full_name,
        email,
        role,
      },
    ]);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}