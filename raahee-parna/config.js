/**
 * ==========================================================
 * CONFIG.JS
 * Raahee Parna — Dudulgaon, Pune
 *
 * Central place for all environment / service credentials.
 * form.js reads everything it needs from window.SITE_CONFIG
 * so no keys are hardcoded inside the form logic itself.
 *
 * Load this file BEFORE form.js in index.html.
 * ==========================================================
 */

window.SITE_CONFIG = {

  /* Supabase project */
  SUPABASE_URL: "https://rgzpytocxhjzxsopkrmu.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnenB5dG9jeGhqenhzb3Brcm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Mjg0MDcsImV4cCI6MjEwMTUwNDQwN30.pMm_t48EOxFd2pnbu2gy4y7EK8fzmem3H4zbbpiqNJ4",

  /* Google Apps Script — used only to send an email notification
     whenever a new enquiry row is inserted into Supabase */
  EMAIL_SERVICE_URL:
    "https://script.google.com/macros/s/AKfycbxqVI8s9atPAcQMf_7AWYdOr6EUYmXKrnRjZQYD5JnjiTPCsNfGvae-A7Z0uoC2f7MoBQ/exec",

  /* Supabase table that stores enquiries */
  SUPABASE_TABLE: "enquiries",

  /* Default project label saved with every enquiry row */
  PROJECT_NAME: "Raahee Parna, Dudulgaon, Pune",

  /* Default Relationship Manager assigned to every enquiry.
     Change these two values to reassign — index.js fills every
     "Relationship Manager" field on the page from here, and
     manager_email travels with each enquiry so it can be shown
     in the notification email as reference info. */
  DEFAULT_DEVELOPER_NAME: "Raahee Corp",

  DEFAULT_MANAGER_NAME: "Rishabh Gohara",
  DEFAULT_MANAGER_EMAIL: "rishabh.housingmantra@gmail.com"

  /* NOTE ON EMAIL ROUTING:
     Who actually receives/CCs the enquiry notification is NOT
     configured here. config.js runs in the browser, so anything
     here could be read or spoofed by anyone calling the Apps
     Script URL directly. The receiver + CC list are fixed
     constants inside apps-script/Code.gs instead — edit them
     there and redeploy. */

};
