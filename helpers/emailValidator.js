"use strict";

const { validate } = require("deep-email-validator");
const dns = require("dns");
const { promisify } = require("util");

const resolveMx = promisify(dns.resolveMx);
const lookup = promisify(dns.lookup);

let mxCheckSupported = true;

// Startup probe to check if direct DNS port 53 queries are working.
// If direct MX lookup fails due to system configuration (e.g. ECONNREFUSED/ETIMEOUT),
// we disable MX check in the library to prevent false negatives.
resolveMx("gmail.com")
  .then(() => {
    console.log("[EmailValidator] DNS MX check is working. Enforcing MX verification.");
    mxCheckSupported = true;
  })
  .catch((err) => {
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEOUT") {
      console.log("[EmailValidator] Outbound port 53 is blocked (connection refused/timeout). Disabling library MX records check to avoid false negatives.");
      mxCheckSupported = false;
    } else {
      console.log(`[EmailValidator] MX probe failed with code: ${err.code}. Keeping MX check enabled.`);
      mxCheckSupported = true;
    }
  });

// Common fake/test domains that should be blocked instantly
const FAKE_DOMAINS = new Set([
  "test.com",
  "example.com",
  "invalid.invalid",
  "localhost",
  "dummy.com",
  "asdf.com",
  "noreply.com",
  "noemail.com",
  "none.com",
  "testing.com",
  "xyz.com",
  "abc.com"
]);

/**
 * Checks if a domain resolves using OS resolver
 * @param {string} domain - Domain name to check
 * @returns {Promise<boolean>} True if domain exists, false otherwise
 */
async function checkDomainExists(domain) {
  try {
    await lookup(domain);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validates syntax, disposable domains, fake domains, typos, and MX records using deep-email-validator
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
async function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmed = email.trim();
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return false;
  }
  const domain = parts[1].toLowerCase();

  // 1. Instantly reject known fake/dummy domains
  if (FAKE_DOMAINS.has(domain)) {
    return false;
  }

  // 2. Fallback check for domain existence if library MX validator is disabled
  if (!mxCheckSupported) {
    const domainExists = await checkDomainExists(domain);
    if (!domainExists) {
      return false;
    }
  }

  try {
    // 3. Perform full verification via deep-email-validator library
    const result = await validate({
      email: trimmed,
      validateRegex: true,
      validateTypo: true,
      validateDisposable: true,
      validateMx: mxCheckSupported,
      validateSMTP: false, // strictly disabled to prevent port 25 block and blacklisting
    });

    return result.valid;
  } catch (error) {
    console.error(`[EmailValidator] Library check encountered error for ${email}:`, error);
    // On unexpected validation errors, fallback to false to be safe
    return false;
  }
}

/**
 * Filters a list of recipients (or strings) and returns only those with valid emails
 * Processes validation in chunks of 30 to prevent system/resolver overload
 * @param {Array<Object|string>} recipients - Array of email strings or objects with an .email property
 * @returns {Promise<Array>} The filtered array containing only valid elements
 */
async function filterValidEmails(recipients) {
  if (!recipients || !Array.isArray(recipients)) {
    return [];
  }

  const results = [];
  const CONCURRENCY_LIMIT = 30;

  for (let i = 0; i < recipients.length; i += CONCURRENCY_LIMIT) {
    const chunk = recipients.slice(i, i + CONCURRENCY_LIMIT);
    const chunkPromises = chunk.map(async (item) => {
      const email = typeof item === "string" ? item : item.email;
      const isValid = await validateEmail(email);
      return { item, isValid };
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const res of chunkResults) {
      if (res.isValid) {
        results.push(res.item);
      } else {
        const email = typeof res.item === "string" ? res.item : res.item.email;
        console.log(`[EmailValidator] Filtered out invalid/disposable/typo email: ${email}`);
      }
    }
  }

  return results;
}

module.exports = {
  validateEmail,
  filterValidEmails
};
