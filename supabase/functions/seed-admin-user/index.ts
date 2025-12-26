import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting admin user seed...');

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAdmin.id,
        { password: adminPassword, email_confirm: true }
      );

      if (updateError) {
        console.error('Error updating admin:', updateError);
        throw updateError;
      }

      // Ensure profile exists
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: existingAdmin.id,
          email: adminEmail,
          display_name: 'Admin User',
          is_active: true,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
      }

      // Ensure user_directory entry exists
      const { error: dirError } = await supabaseAdmin
        .from('user_directory')
        .upsert({
          id: existingAdmin.id,
          email: adminEmail,
          display_name: 'Admin User',
          is_simulated: false,
          is_active: true,
        }, { onConflict: 'id' });

      if (dirError) {
        console.error('Error upserting user_directory:', dirError);
      }

      // Ensure admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: existingAdmin.id,
          role: 'admin',
        }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error upserting role:', roleError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user updated successfully',
          email: adminEmail,
          userId: existingAdmin.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new admin user
    console.log('Creating new admin user...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Admin User',
      },
    });

    if (createError) {
      console.error('Error creating admin:', createError);
      throw createError;
    }

    console.log('Admin user created:', newUser.user?.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user?.id,
        email: adminEmail,
        display_name: 'Admin User',
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Create user_directory entry
    const { error: dirError } = await supabaseAdmin
      .from('user_directory')
      .insert({
        id: newUser.user?.id,
        email: adminEmail,
        display_name: 'Admin User',
        is_simulated: false,
        is_active: true,
      });

    if (dirError) {
      console.error('Error creating user_directory:', dirError);
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user?.id,
        role: 'admin',
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    console.log('Admin user setup complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        email: adminEmail,
        userId: newUser.user?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed admin error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
