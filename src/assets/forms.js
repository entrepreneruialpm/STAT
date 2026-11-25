// Sends form submissions to Supabase. Loaded as an ES module on every page.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.STAT_CONFIG || {};
const isConfigured =
  cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.includes("YOUR-");
const supabase = isConfigured ? createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

document.querySelectorAll("form.stat-form").forEach((form) => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Honeypot: bots fill hidden fields. Pretend success and drop the submission.
    if (form.elements.website && form.elements.website.value) {
      form.reset();
      status.textContent = "Thanks! We received your request.";
      return;
    }

    if (!form.reportValidity()) return;

    if (!supabase) {
      status.textContent = "Online forms are not connected yet. Please call 1-855-855-STAT.";
      return;
    }

    const row = { source_page: window.location.pathname.slice(0, 200) };
    for (const el of form.querySelectorAll("input[name], textarea[name]")) {
      if (el.name === "website") continue;
      const value = el.value.trim();
      row[el.name] = value === "" ? null : value;
    }
    if (row.tree_count !== undefined && row.tree_count !== null) row.tree_count = Number(row.tree_count);

    button.disabled = true;
    status.textContent = "Sending...";

    const { error } = await supabase.from(form.dataset.table).insert(row);

    button.disabled = false;
    if (error) {
      console.error("Form submit failed:", error.message);
      status.textContent = "Sorry, something went wrong. Please call us at 1-855-855-STAT.";
      return;
    }
    form.reset();
    status.textContent = "Thanks! We received your request and will be in touch.";
  });
});
