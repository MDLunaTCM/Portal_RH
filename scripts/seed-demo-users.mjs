import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.DEMO_USERS_PASSWORD ?? "Demo1234!";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_USERS = [
  {
    key: "employee",
    role: "employee",
    email: "demo.employee@portalrh.local",
    firstName: "Demo",
    lastName: "Employee",
    employeeId: "DEMO-EMP-001",
  },
  {
    key: "manager",
    role: "manager",
    email: "demo.manager@portalrh.local",
    firstName: "Demo",
    lastName: "Manager",
    employeeId: "DEMO-MGR-001",
  },
  {
    key: "hr_admin",
    role: "hr_admin",
    email: "demo.hr@portalrh.local",
    firstName: "Demo",
    lastName: "HR",
    employeeId: "DEMO-HR-001",
  },
  {
    key: "super_admin",
    role: "super_admin",
    email: "demo.super@portalrh.local",
    firstName: "Demo",
    lastName: "Super",
    employeeId: "DEMO-SUPER-001",
  },
];

async function findUserByEmail(email) {
  const targetEmail = email.toLowerCase();
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const found = data.users.find(
      (user) => (user.email ?? "").toLowerCase() === targetEmail
    );

    if (found) {
      return found;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(user) {
  const existing = await findUserByEmail(user.email);
  if (existing) {
    return { user: existing, created: false };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role,
      seeded_by: "seed-demo-users",
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`No se pudo crear el usuario ${user.email}`);
  }

  return { user: data.user, created: true };
}

async function upsertProfileRows(usersByKey) {
  const rows = DEMO_USERS.map((demo) => {
    const authUser = usersByKey[demo.key];

    return {
      id: authUser.id,
      email: demo.email,
      first_name: demo.firstName,
      last_name: demo.lastName,
      role: demo.role,
      employee_id: demo.employeeId,
      is_active: true,
    };
  });

  const { error } = await supabase.from("profiles").upsert(rows, { onConflict: "id" });
  if (error) {
    throw error;
  }
}

async function wireManagerRelations(usersByKey) {
  const employeeId = usersByKey.employee.id;
  const managerId = usersByKey.manager.id;
  const hrAdminId = usersByKey.hr_admin.id;

  const { error } = await supabase
    .from("profiles")
    .update({ manager_id: managerId })
    .eq("id", employeeId);

  if (error) {
    throw error;
  }

  const { error: managerError } = await supabase
    .from("profiles")
    .update({ manager_id: hrAdminId })
    .eq("id", managerId);

  if (managerError) {
    throw managerError;
  }
}

async function main() {
  console.log("\n🌱 Seeding usuarios demo por rol...\n");

  const usersByKey = {};

  for (const demo of DEMO_USERS) {
    const { user, created } = await ensureAuthUser(demo);
    usersByKey[demo.key] = user;

    console.log(
      `${created ? "✅ Creado" : "♻️  Reutilizado"} ${demo.role.padEnd(11)} -> ${demo.email}`
    );
  }

  await upsertProfileRows(usersByKey);
  await wireManagerRelations(usersByKey);

  console.log("\n🔐 Password demo:", DEMO_PASSWORD);
  console.log("✅ Seed demo finalizado.\n");
}

main().catch((error) => {
  console.error("\n❌ Error en seed-demo-users:");
  console.error(error.message ?? error);
  process.exit(1);
});
