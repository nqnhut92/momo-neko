# Deployment

The site is deployed on Vercel from `main`.

1. In Vercel, select **Add New → Project** and import `nqnhut92/momo-neko`.
2. Keep **Root Directory** at the repository root. `vercel.json` configures **Other**, no build command, and **Output Directory: public**.
3. Deploy. No environment variables or package installation are needed.
4. Open the Vercel project's **Analytics** tab and click **Enable**.
5. Redeploy once after enabling Analytics, then visit the production URL to generate a page view.

The tracking snippet is already in `public/index.html`. Analytics requires the Vercel dashboard setting; adding the script alone does not enable collection. The `/_vercel/insights/script.js` route is provided by Vercel and is expected to return 404 during a plain local preview.

Official setup: https://vercel.com/docs/analytics/quickstart

Assets under `/assets/*` are cached for one day (see `vercel.json`), so returning visitors may keep an old asset for up to a day after you replace it.
