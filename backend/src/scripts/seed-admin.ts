import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminFullName = process.env.ADMIN_FULL_NAME || "System Administrator";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

if (!adminEmail || !adminPassword) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ensureAdmin() {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  const existingUser = existingUsers.users.find((user) => user.email === adminEmail);

  let userId = existingUser?.id;

  if (!existingUser) {
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminFullName
      }
    });

    if (createError || !createdUser.user) {
      throw createError || new Error("Unable to create admin user.");
    }

    userId = createdUser.user.id;
  } else {
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        full_name: adminFullName
      }
    });

    if (updateAuthError) {
      throw updateAuthError;
    }
  }

  const profileVariants: Array<Record<string, unknown>> = [
    {
      id: userId,
      email: adminEmail,
      full_name: adminFullName,
      role: "admin",
      locale: "ar",
      is_active: true
    },
    {
      id: userId,
      full_name: adminFullName,
      role: "admin",
      locale: "ar"
    },
    {
      id: userId,
      full_name: adminFullName,
      role: "admin"
    },
    {
      id: userId,
      role: "admin"
    }
  ];

  let lastProfileError: unknown = null;

  for (const profilePayload of profileVariants) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (!profileError) {
      console.log(
        JSON.stringify({
          success: true,
          email: adminEmail,
          fullName: adminFullName,
          role: "admin"
        })
      );
      return;
    }

    lastProfileError = profileError;
  }

  throw lastProfileError instanceof Error
    ? lastProfileError
    : new Error("Unable to update admin profile.");
}

ensureAdmin().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
