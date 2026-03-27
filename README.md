This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Seed de usuarios demo (dev)

Para crear un usuario demo por cada rol (`employee`, `manager`, `hr_admin`, `super_admin`) usando Supabase Auth + `profiles`:

1. Define variables en tu entorno local:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54324
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
DEMO_USERS_PASSWORD=Demo1234!
```

2. Ejecuta el seeder:

```bash
npm run seed:demo-users
```

Usuarios creados (o reutilizados si ya existen):

- `demo.employee@portalrh.local`
- `demo.manager@portalrh.local`
- `demo.hr@portalrh.local`
- `demo.super@portalrh.local`

Notas:

- El script es idempotente: si ya existen, los reutiliza y actualiza su `profile`.
- Se enlaza `manager_id` para que el `employee` reporte al `manager` y el `manager` al `hr_admin`.
- Requiere `SUPABASE_SERVICE_ROLE_KEY` porque crea usuarios en `auth.users`.
