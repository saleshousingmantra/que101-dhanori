/**
 * ==========================================================
 * FORM.JS
 * Raahee Parna — Dudulgaon, Pune
 *
 * Handles:
 *  - Supabase connection (credentials come from config.js)
 *  - Enquiry form validation
 *  - Form submission (works for the footer form and the popup form)
 *  - Double-submit protection
 *  - Error focus + scroll
 *  - Success message
 *  - Google Apps Script email notification
 *  - Thank-you page redirect
 *
 * Load order in index.html:
 *   1. Supabase JS SDK (CDN)
 *   2. config.js
 *   3. form.js   <-- this file
 *   4. index.js
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    /* =====================================================
       READ CONFIG (from config.js — never hardcoded here)
    ===================================================== */

    const CONFIG = window.SITE_CONFIG || {};

    const SUPABASE_URL = CONFIG.SUPABASE_URL;
    const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
    const EMAIL_SERVICE_URL = CONFIG.EMAIL_SERVICE_URL;
    const SUPABASE_TABLE = CONFIG.SUPABASE_TABLE || "enquiries";
    const DEFAULT_PROJECT_NAME = CONFIG.PROJECT_NAME || "Raahee Parna, Dudulgaon, Pune";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("Missing Supabase config. Make sure config.js is loaded before form.js.");
        return;
    }

    /* =====================================================
       CHECK SUPABASE LIBRARY
    ===================================================== */

    if (!window.supabase) {
        console.error("Supabase JS library is not loaded.");
        return;
    }

    /* =====================================================
       CREATE SUPABASE CLIENT
    ===================================================== */

    const supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    console.log("Supabase form system initialized.");

    /* =====================================================
       ERROR FOCUS + SCROLL
    ===================================================== */

    function focusAndScroll(field, message) {
        if (!field) {
            alert(message);
            return;
        }

        field.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(function () {
            field.focus();
        }, 500);

        alert(message);
    }

    /* =====================================================
       SUCCESS MESSAGE
       Looks for a .success-message next to the form first,
       falls back to #successMessage for older markup.
    ===================================================== */

    function showSuccessMessage(form) {
        let message = null;

        if (form && form.parentElement) {
            message = form.parentElement.querySelector(".success-message");
        }

        if (!message) {
            message = document.getElementById("successMessage");
        }

        if (message) {
            message.classList.add("active");
            form.style.display = "none";

            setTimeout(function () {
                message.classList.remove("active");
                form.style.display = "";
            }, 6000);
        }
    }

    /* =====================================================
       SEND EMAIL NOTIFICATION
    ===================================================== */

    async function sendEmailNotification(name, phone, email, interest, project, managerName, managerEmail) {
        try {
            console.log("Sending email notification...");

            if (!EMAIL_SERVICE_URL) {
                console.warn("EMAIL_SERVICE_URL not set in config.js — skipping email notification.");
                return false;
            }

            /*
             * Google Apps Script is used only as an email
             * notification service. no-cors is required because
             * Apps Script does not return normal CORS headers,
             * so we never try to read the response body.
             *
             * Note: who actually receives/CCs this email is NOT
             * decided here — Code.gs uses its own fixed constants
             * for that (see the note at the top of that file).
             * manager_name/manager_email below are sent only as
             * reference content shown inside the email body.
             */

            await fetch(EMAIL_SERVICE_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    name: name,
                    phone: phone,
                    email: email || "",
                    interest: interest || "",
                    project: project || DEFAULT_PROJECT_NAME,
                    manager_name: managerName || "",
                    manager_email: managerEmail || ""
                })
            });

            console.log("Email notification request sent.");
            return true;

        } catch (error) {
            console.error("Email notification error:", error);

            /*
             * Do not block the user's enquiry — the record has
             * already been saved successfully in Supabase.
             */
            return false;
        }
    }

    /* =====================================================
       FORM SUBMISSION
    ===================================================== */

    const forms = document.querySelectorAll("form");

    if (!forms.length) {
        console.warn("No forms found on this page.");
        return;
    }

    forms.forEach(function (form) {

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            /* PREVENT MULTIPLE SUBMISSIONS */
            if (form.dataset.submitting === "true") {
                console.log("Submission already in progress.");
                return;
            }

            /* GET FORM FIELDS */
            const nameInput = form.querySelector('[name="name"]');
            const phoneInput = form.querySelector('[name="phone"]');
            const emailInput = form.querySelector('[name="email"]');
            const interestInput = form.querySelector('[name="interest"]');
            const projectInput = form.querySelector('[name="project"]');
            const managerNameInput = form.querySelector('[name="manager_name"]');
            const managerEmailInput = form.querySelector('[name="manager_email"]');
            const submitButton = form.querySelector('button[type="submit"]');

            /* GET VALUES */
            const name = nameInput?.value.trim() || "";
            const phone = phoneInput?.value.trim() || "";
            const email = emailInput?.value.trim() || "";
            const interest = interestInput?.value.trim() || "";
            const project = projectInput?.value.trim() || DEFAULT_PROJECT_NAME;
            const managerName = managerNameInput?.value.trim() || "";
            const managerEmail = managerEmailInput?.value.trim() || "";

            /* VALIDATE NAME */
            if (name.length < 3) {
                focusAndScroll(nameInput, "Please enter your full name.");
                return;
            }

            /* VALIDATE PHONE */
            if (!/^[6-9][0-9]{9}$/.test(phone)) {
                focusAndScroll(
                    phoneInput,
                    "Please enter a valid 10-digit mobile number."
                );
                return;
            }

            /* VALIDATE EMAIL — OPTIONAL */
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                focusAndScroll(emailInput, "Please enter a valid email address.");
                return;
            }

            /* LOCK FORM */
            form.dataset.submitting = "true";

            const originalButtonText = submitButton
                ? submitButton.textContent.trim()
                : "Submit";

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Submitting...";
                submitButton.setAttribute("aria-disabled", "true");
                submitButton.style.cursor = "not-allowed";
            }

            /* SUPABASE INSERT */
            try {
                console.log("Submitting enquiry to Supabase...");

                const { error } = await supabaseClient
                    .from(SUPABASE_TABLE)
                    .insert({
                        name: name,
                        phone: phone,
                        email: email || null,
                        interest: interest || null,
                        project: project,
                        manager_name: managerName || null,
                        manager_email: managerEmail || null
                    });

                if (error) {
                    console.error("Supabase Error:", error);

                    const detail = [error.message, error.details, error.hint]
                        .filter(Boolean)
                        .join(" — ");

                    throw new Error(detail || "Unable to submit enquiry.");
                }

                console.log("Enquiry successfully saved in Supabase.");

                /*
                 * Let other scripts (index.js) react to a successful
                 * submit — e.g. the popup uses this to open WhatsApp
                 * or place a call, but only now that the enquiry is
                 * actually confirmed saved, never before.
                 */
                form.dispatchEvent(new CustomEvent("enquirySubmitted", {
                    bubbles: true,
                    detail: {
                        name: name,
                        phone: phone,
                        email: email,
                        interest: interest,
                        project: project,
                        managerName: managerName,
                        managerEmail: managerEmail
                    }
                }));

                await sendEmailNotification(name, phone, email, interest, project, managerName, managerEmail);

                showSuccessMessage(form);
                form.reset();

                setTimeout(function () {
                    window.location.href = "/raahee-parna/thank-you/";
                }, 1500);

            } catch (error) {
                console.error("Submission Error:", error);

                alert(
                    error.message ||
                        "Unable to submit your enquiry. Please try again."
                );

            } finally {
                form.dataset.submitting = "false";

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.removeAttribute("aria-disabled");
                    submitButton.textContent = originalButtonText;
                    submitButton.style.cursor = "";
                }
            }
        });
    });

    /* =====================================================
       PHONE INPUT — ALLOW ONLY NUMBERS
    ===================================================== */

    document.querySelectorAll('input[name="phone"]').forEach(function (input) {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, "");

            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    });

    console.log("Form.js loaded successfully.");
});
