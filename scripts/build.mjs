// Builds the static site into ./dist from content/*.json.
// No dependencies. Run: node scripts/build.mjs
// Supabase settings are read from env vars SUPABASE_URL and SUPABASE_ANON_KEY
// (GitHub Actions passes them from repository secrets).

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = JSON.parse(readFileSync(join(root, "content/site.json"), "utf8"));
const pages = JSON.parse(readFileSync(join(root, "content/pages.json"), "utf8"));
const out = join(root, "dist");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, "src/assets"), join(out, "assets"), { recursive: true });

// Runtime config for the browser. Anon key is public by design; RLS protects the tables.
const runtimeConfig = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
};
writeFileSync(join(out, "assets/config.js"), `window.STAT_CONFIG = ${JSON.stringify(runtimeConfig)};\n`);

// GitHub Pages custom domain
writeFileSync(join(out, "CNAME"), `${site.brand.domain}\n`);

const buttons = (items = []) =>
  items.length
    ? `<div class="buttons">${items.map((b) => `<a class="btn" href="${esc(b.href)}">${esc(b.label)}</a>`).join("")}</div>`
    : "";

function formHtml(f) {
  const fields = f.fields
    .map((fld) => {
      const id = `${f.id}-${fld.name}`;
      const req = fld.required ? " required" : "";
      const label = `<label for="${id}">${esc(fld.label)}${fld.required ? " *" : ""}</label>`;
      if (fld.type === "textarea")
        return `<div class="field">${label}<textarea id="${id}" name="${esc(fld.name)}" rows="4" maxlength="2000"${req}></textarea></div>`;
      return `<div class="field">${label}<input id="${id}" name="${esc(fld.name)}" type="${esc(fld.type || "text")}" maxlength="200"${req}></div>`;
    })
    .join("\n");
  return `<form class="stat-form" data-table="${esc(f.table)}" novalidate>
  <h2>${esc(f.title)}</h2>
  ${fields}
  <div class="hp" aria-hidden="true"><label>Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
  <button class="btn" type="submit">${esc(f.submit)}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}

function section(s) {
  switch (s.type) {
    case "hero":
      return `<section class="hero">
  ${s.image ? `<img class="hero-img" src="${esc(s.image)}" alt="${esc(s.alt)}">` : ""}
  <div class="hero-copy"><h1>${esc(s.heading)}</h1>${s.text ? `<p>${esc(s.text)}</p>` : ""}${buttons(s.buttons)}</div>
</section>`;
    case "h1":
      return `<h1>${esc(s.text)}</h1>`;
    case "h2":
      return `<h2>${esc(s.text)}</h2>`;
    case "h3":
      return `<h3>${esc(s.text)}</h3>`;
    case "p":
      return `<p>${esc(s.text)}</p>`;
    case "list": {
      const tag = s.ordered ? "ol" : "ul";
      const items = s.items
        .map((i) =>
          typeof i === "string"
            ? `<li>${esc(i)}</li>`
            : `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`
        )
        .join("");
      return `<${tag} class="list">${items}</${tag}>`;
    }
    case "cards":
      return `<div class="cards">${s.items
        .map(
          (c) => `<article class="card">
  ${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : ""}
  <h3>${c.href ? `<a href="${esc(c.href)}">${esc(c.title)}</a>` : esc(c.title)}</h3>
  ${c.text ? `<p>${esc(c.text)}</p>` : ""}
</article>`
        )
        .join("")}</div>`;
    case "buttons":
      return buttons(s.items);
    case "image":
      return `<figure><img src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy">${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ""}</figure>`;
    case "table":
      return `<div class="table-wrap"><table><thead><tr>${s.headers
        .map((h) => `<th scope="col">${esc(h)}</th>`)
        .join("")}</tr></thead><tbody>${s.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>`;
    case "form":
      return formHtml(site.forms[s.form]);
    case "notice":
      return `<aside class="notice" role="note">${esc(s.text)}</aside>`;
    default:
      throw new Error(`Unknown section type: ${s.type}`);
  }
}

function nav() {
  return `<ul class="menu">${site.nav
    .map((item) => {
      const sub = item.children?.length
        ? `<ul class="submenu">${item.children
            .map((c) => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`)
            .join("")}</ul>`
        : "";
      return `<li${sub ? ' class="has-sub"' : ""}><a href="${esc(item.href)}">${esc(item.label)}</a>${sub}</li>`;
    })
    .join("")}</ul>`;
}

function layout(p) {
  const { brand, contact, social, footerLinks } = site;
  const body = p.sections.map(section).join("\n");
  const status = p.contentStatus === "paraphrased" ? "<!-- content: paraphrased from the live site. Replace with original wording. -->" : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${status}
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description || brand.description)}">
<link rel="icon" href="${esc(brand.icon)}">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="logo" href="/"><img src="${esc(brand.logo)}" alt="${esc(brand.name)}"></a>
    <nav aria-label="Main">${nav()}</nav>
    <a class="call" href="tel:${esc(contact.phoneTel)}">${esc(contact.phoneDisplay)}</a>
  </div>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="logo" href="/"><img src="${esc(brand.icon)}" alt="" width="60" height="60"></a>
      <p><strong>${esc(brand.name)}</strong></p>
      <p>${contact.address.map(esc).join("<br>")}</p>
      <p><a href="tel:${esc(contact.phoneTel)}">${esc(contact.phoneDisplay)}</a><br>
      <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p>
    </div>
    <div>
      <ul class="footer-links">${footerLinks.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>
    </div>
    <div>
      <ul class="social">${social.map((s) => `<li><a href="${esc(s.href)}" rel="noopener">${esc(s.label)}</a></li>`).join("")}</ul>
    </div>
  </div>
  <p class="wrap copyright">${esc(contact.copyright)}</p>
</footer>
<script src="/assets/config.js"></script>
<script type="module" src="/assets/forms.js"></script>
</body>
</html>
`;
}

for (const p of pages) {
  const dir = p.path === "/" ? out : join(out, p.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), layout(p));
}

// Friendly 404 page (GitHub Pages serves 404.html for unknown paths)
writeFileSync(
  join(out, "404.html"),
  layout({
    title: `Page not found | ${site.brand.name}`,
    sections: [
      { type: "h1", text: "Page not found" },
      { type: "p", text: "That page does not exist. Use the menu or call us." },
      { type: "buttons", items: [{ label: "Back to home", href: "/" }] },
    ],
  })
);

console.log(`Built ${pages.length} pages into ${out}`);
