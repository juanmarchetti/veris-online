This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚨 SECURITY WARNING 🚨
**ATTENTION:** The `.env.example` file in previous versions of this repository contained real, functional Supabase credentials (including the `SUPABASE_SECRET_KEY` and the `DATABASE_URL` password in plain text). 
**ACTION REQUIRED IMMEDIATELY:** If you are the owner of this Supabase project, you must **rotate the `service_role key` and the Postgres database password from the Supabase dashboard immediately**. The keys have been exposed and your database is at risk.


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

## Pagos sandbox

El checkout de pago corre en modo sandbox por defecto. Este modo aprueba pagos de prueba, confirma la cita y no cobra dinero real.

Variables recomendadas en Netlify:

```env
PAYMENTS_MODE=sandbox
NEXT_PUBLIC_PAYMENTS_MODE=sandbox
```

## SEO y dominio

Variables recomendadas en Netlify:

```env
NEXT_PUBLIC_SITE_URL=https://tu-sitio.netlify.app
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=token_entregado_por_google_search_console
```

`NEXT_PUBLIC_SITE_URL` alimenta canonical, sitemap, manifest y datos estructurados. `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` permite validar el sitio en Google Search Console cuando el jurado o el propietario del dominio necesite indexarlo.

Para probar el flujo usa la tarjeta `4242 4242 4242 4242`, vencimiento `12/30` y CVV `123`.

Aplica la migracion `supabase/migrations/0024_pago_sandbox_metadata.sql` en Supabase para guardar la referencia `SBX`, el ambiente y el detalle del pago de prueba.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
