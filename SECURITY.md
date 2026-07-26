# Security notes

Written from the perspective of someone trying to break this, then fixing what they found. Each
control below exists because a specific attack works without it.

## The central decision: answers never leave the server

The authored quiz JSON stores `answer` and `explanation` on the same object as the question stem.
The obvious implementation ships that object to the client and hides the answer in the interface.
That implementation is broken on arrival: anyone can open the network tab and read the key for
every question in the catalogue, and once one learner does it, the assessment data stops measuring
anything.

The fix runs through four layers:

1. **Schema.** `answer` and `explanation` are `select: false` on the Mongoose question schema, so
   they are absent from query results unless a caller explicitly asks for them.
2. **One opt-in point.** `loadAnswerKey()` in `grading.service.js` is the only function in the
   codebase that re-selects those fields. If answers ever leak, the leak went through there.
3. **Issued-question binding.** Starting an attempt records the exact question ids on the attempt
   document. A submission naming any other id is rejected, so a client cannot grade arbitrary
   questions one at a time to farm the key.
4. **No mid-attempt reads.** Fetching an in-progress attempt returns metadata only. Grading and
   explanations are returned once, in the response to the submission that produced them.

Related: unanswered issued questions count toward the denominator, so skipping a hard question is
not a way to protect a percentage.

## Authentication

**Argon2id, not bcrypt.** 19 MiB memory cost, 2 passes, the OWASP baseline. Argon2id's memory
hardness is what makes GPU and ASIC cracking expensive; bcrypt's cost parameter does not buy the
same resistance.

**Split token model.** A 15-minute access token in memory, a 30-day refresh token in an httpOnly
cookie on the web and in the iOS Keychain or Android Keystore on mobile. Putting the long-lived
credential somewhere JavaScript cannot read it is what turns a cross-site scripting bug from
account takeover into a nuisance.

**Rotation with reuse detection.** Every refresh issues a new token and marks the old one used.
Presenting an already-used token means two parties hold it, so the entire token family is revoked
and the event is written to the audit log. This is the control that catches a stolen refresh token
rather than merely limiting how long it stays useful.

**Revocation without a blocklist.** Access tokens carry the user's `tokenVersion`. A password
change increments it, and every outstanding token stops verifying immediately, with no
distributed blocklist to keep in sync.

**No user enumeration.** A sign-in attempt for an address that does not exist burns a comparable
amount of Argon2 work against a decoy hash and returns the same message and the same status as a
wrong password. Registration reports a conflict without echoing back which value conflicted.

**Lockout.** Eight failed attempts locks the account for fifteen minutes. The auth rate limiter is
keyed on IP plus submitted email, so a shared classroom NAT address does not lock out a whole
cohort while a distributed attempt against one account is still caught.

## Injection and input

Every request body, query and parameter is parsed by a Zod schema, and the parsed result
**replaces** the original. Merging would leave unknown keys in place; replacing drops them, so a
request cannot smuggle `role: "admin"` past a controller that spreads the body into a model.

`express-mongo-sanitize` strips `$`-prefixed and dotted keys, which is what stops a submitted
`{"$ne": null}` from turning a `findOne` into a match-anything query. Body size is capped at 100 kB.

## Transport and headers

The API sets a near-total-deny CSP, since a JSON endpoint has no legitimate reason to load a
script, frame or image. HSTS is enabled in production with a two-year max-age and preload.
`x-powered-by` is removed.

The website's CSP is stricter where it counts: `connect-src` names only the API origin, so
injected code cannot exfiltrate to an endpoint of its own choosing. `frame-ancestors 'none'`
blocks clickjacking, and `Permissions-Policy` denies camera, microphone, geolocation and payment,
none of which this product uses.

CORS is an exact-origin allowlist with no wildcards. The configuration loader exits at boot if
`CORS_ORIGINS` contains `*` in production, because a wildcard combined with credentialed cookies
is the most common way a sound API leaks sessions.

## Rate limiting and denial of service

Three tiers: a broad 600-per-15-minutes ceiling, 10-per-15-minutes on credential endpoints, and
20-per-minute on attempt creation. Argon2 verification is deliberately expensive, which makes an
unlimited login endpoint a self-inflicted denial of service; the auth limiter is as much about
protecting the container as about protecting accounts.

The password field is capped at 200 characters for the same reason. Hashing time grows with input
length.

## Privacy

The audit log stores hashed source addresses, not raw ones: enough to correlate repeated attempts
from one source without retaining a directly identifying network address. Logs redact
authorization headers, cookies, passwords and email addresses before they reach the transport,
because a Railway log drain is a different trust boundary from the database.

Cohort reporting for facilitators returns counts and averages only, never a per-learner answer
trail. Classroom visibility should not become surveillance.

## Content integrity

`validate-content.js` runs without a database and can gate a pull request. Beyond schema checks it
catches the failures that are invisible on visual review: an answer key pointing at an option
letter that is not present, duplicate question ids across the corpus, a table of contents that
disagrees with the questions actually there, and a module whose companion quiz is missing.

## Known gaps

Named rather than hidden, because an honest list is more useful than an implied clean bill.

- **No email verification.** Addresses are unconfirmed. Add a verification flow before any
  password-reset feature ships; without it, reset is an account-takeover primitive.
- **No password reset.** Deliberately absent for the same reason.
- **No CSRF token.** The refresh cookie is `SameSite=Lax` and scoped to `/api/auth`, and every
  other endpoint requires a bearer token that a cross-site form cannot supply. Add a token if a
  cookie ever authenticates a state-changing route.
- **No multi-factor authentication.** Worth adding for facilitator and admin roles first.
- **Rate limit state is per-instance.** Fine at one Railway replica. Move to `rate-limit-mongo`
  or Redis before scaling out, or the effective limit multiplies by the replica count.
- **Client-supplied `timeOnTaskMs` is telemetry only.** It is stored but never affects scoring,
  because a value supplied by the client must not be trusted with anything that matters.

## Reporting

Send findings to the address on codewithoutlimits.net. Please allow 90 days before public
disclosure.
