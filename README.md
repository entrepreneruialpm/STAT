# Save The Ash Tree Co. website

Static site for savetheashtree.com, hosted on **GitHub Pages**. Form submissions (estimate requests and townhall sign-ups) are stored in **Supabase**.

```
content/site.json          Brand, contact, menu, footer, form definitions
content/pages.json         Every page and its text (edit here)
scripts/build.mjs          Builds the site into dist/ (no dependencies)
src/assets/                CSS and the form handler
supabase/migrations/       Database tables and security rules
.github/workflows/         Build + deploy to GitHub Pages on every push to main
```

Menu pages kept at their current URLs, so existing links and search rankings still work: `/eab`, `/do-i-have-an-ash`, `/is-my-tree-affected`, `/injection-protection`, `/prevention-vs-recovery`, `/what-makes-us-different`, `/blog`, `/about`, `/about-5`, `/summer-internship`, `/arboristservicescoordinator`, `/locations-3`, `/event-list`, `/eab-townhalls`, `/privacy-policy`, `/terms-conditions`.

## 1. Set up Supabase

1. Create a project at supabase.com (or use an existing one).
2. Open **SQL Editor**, paste the contents of `supabase/migrations/0001_form_submissions.sql`, and run it. This creates `quote_requests` and `townhall_signups`. Anonymous visitors can insert rows but cannot read them.
3. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key. The anon key is safe in a public website. Never put the `service_role` key in this repo.

## 2. Set up GitHub

1. Create a repository (for example `save-the-ash-tree-site`) and push this folder to its `main` branch.
2. In the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Go to **Settings → Secrets and variables → Actions** and add two secrets:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon public key
4. Push to `main` (or run the workflow manually). The workflow builds `dist/` and deploys it.

## 3. Point the domain

In **Settings → Pages → Custom domain**, enter `savetheashtree.com`. The build writes a `CNAME` file automatically. At your DNS provider, point the domain to GitHub Pages (`A` records to 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, or a `CNAME` for `www`). Turn on **Enforce HTTPS** once the certificate is issued. Do this before cancelling Wix.

## 4. Run it locally (optional)

```
node scripts/build.mjs
npx serve dist
```

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the shell first if you want the forms to save. Without them, the forms show a "not connected yet" message and nothing breaks.

## 5. Read the submissions

In the Supabase dashboard, open **Table Editor** and pick `quote_requests` or `townhall_signups`. Each row has a `handled` checkbox for follow-up. Only people signed in to your Supabase account can see these rows.

---

## Open items before go-live

**Copy is not yet the original wording.** The live site's text could only be read through a summarising fetch, so most pages were rebuilt from summaries and are marked `contentStatus: "paraphrased"` in `content/pages.json`. To restore the exact text, replace each section's `text` field with the original, or send the original text and it will be dropped in.

Legal pages (`/privacy-policy`, `/terms-conditions`) only have headings and key points. Paste the full original text before launch.

**Not yet built:**
- The 20 blog post pages (`/post/...`). The blog index lists their titles.
- The six city pages under `/ash-tree-treatment/` (Minneapolis, Sioux Falls, St. Cloud, Dallas, Marshall, Fort Worth). Only the Minneapolis page structure was captured.
- Hiring details for **Seasonal Tree Injector** and **Summer Office Assistant**, plus the customer review on the hiring page.
- The **Insta-Quote** form fields. The form on `/about` is a new build with sensible fields. Adjust them in `content/site.json`.

**Conflicts in the current site to decide on:**
- **Footer phone:** the live footer uses `tel:855-855`, which is incomplete. The rebuild uses `1-855-855-STAT` (`+18558557828`) everywhere.
- **Email domain:** the site uses `info@savetheashtree.com` in most places, but `ashtreecare.com` appears in the do-I-have-an-ash page, the locations list, the Minneapolis contact details, and the Terms link. The rebuild uses `info@savetheashtree.com`. Confirm this, and whether the city emails should move too.
- **Office address:** the privacy policy's contact section lists `8906 Regent Parkway, Minneapolis, MN 55443`. Every page footer lists `7600 Boone Ave, Ste 29, Brooklyn Park, MN 55428`. The rebuild uses the Brooklyn Park address.
- **Privacy and Terms links on About:** the About page's footer links point to `ashtreecare.com`. The rebuild points them to this domain.

**Placeholders to replace:**
- The Airtable application links on the hiring, internship, and coordinator pages are `REPLACE-WITH-...`. Paste the real URLs in `content/pages.json`.

**Images:** the rebuild links to images on Wix's CDN (`static.wixstatic.com`). Download them into `src/assets/images/` and update the paths before cancelling Wix, or the images will break.

**Design:** colours and fonts are placeholders in `src/assets/styles.css` (`:root` variables). Replace them with the brand's values.

**New behaviour:** the **EAB Townhalls** page now has a sign-up form. The live page had no form.
