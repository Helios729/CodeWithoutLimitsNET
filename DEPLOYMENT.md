# Deployment

Three targets: the API on Railway, the website on Netlify, and the app through EAS Build.

## 1. MongoDB

Either the Railway MongoDB plugin or MongoDB Atlas works. Atlas is the better choice once there
is real learner data, because point-in-time restore is available on the paid tiers and the
network access list is a separate control from the connection string.

**Atlas setup**

1. Create a cluster and a database named `codewithoutlimits`.
2. Create a database user with the `readWrite` role on that database only. Do not use an
   organisation-level admin user for the application.
3. Under Network Access, add Railway's outbound addresses. Do not add `0.0.0.0/0`: a connection
   string that leaks is only useful to an attacker who can also reach the cluster.
4. Copy the SRV connection string into `MONGODB_URI`.

**Indexes.** `autoIndex` is disabled in production so a rolling restart never triggers an index
build against a live collection. Create them once after the first deploy:

```bash
railway run node -e "
  import('./apps/api/src/config/db.js').then(async (db) => {
    await db.connectDatabase();
    const m = await import('mongoose');
    for (const name of Object.keys(m.default.models)) {
      await m.default.models[name].syncIndexes();
      console.log('indexed', name);
    }
    process.exit(0);
  });
"
```

## 2. API on Railway

1. Create a project and add a service pointed at this repository.
2. Root directory: the repository root. `railway.json` supplies the build and start commands.
3. Set the service variables listed in `apps/api/.env.example`. Railway injects `PORT`; do not
   override it.
4. Add a custom domain, `api.codewithoutlimits.net`, and create the CNAME Railway shows you.
5. The healthcheck path is `/api/health`. It returns 503 while MongoDB is unreachable, so a bad
   deploy fails its healthcheck rather than serving errors.

**Variables that matter most**

| Variable | Value | Why |
|---|---|---|
| `NODE_ENV` | `production` | Turns on HSTS, secure cookies, and suppresses stack traces in responses |
| `CORS_ORIGINS` | `https://codewithoutlimits.net,https://www.codewithoutlimits.net` | Exact origins, no wildcards |
| `COOKIE_DOMAIN` | `.codewithoutlimits.net` | Lets the refresh cookie work on apex and www |
| `TRUST_PROXY_HOPS` | `1` | Railway terminates TLS at exactly one proxy |
| `JWT_ACCESS_SECRET` | 48 random bytes | Rotating this signs out nobody; it only invalidates short-lived tokens |
| `JWT_REFRESH_SECRET` | different 48 random bytes | Rotating this signs everyone out |

`TRUST_PROXY_HOPS` is worth a second look. Express accepts `trust proxy: true`, which trusts the
entire `X-Forwarded-For` chain. A client can write that header itself, so trusting all of it lets
anyone present a fresh source address on every request and walk past per-IP rate limiting. A
specific hop count reads only the address Railway appended.

**Deploy the content on release.** Add `npm run ingest -w @cwl/api` as a Railway pre-deploy
command so content changes ship with the code.

## 3. Website on Netlify

1. Connect the repository. `netlify.toml` already sets the base, build command and publish
   directory, so leave the UI fields empty and let the file win.
2. Set one build environment variable: `VITE_API_URL=https://api.codewithoutlimits.net/api`.
   Everything prefixed `VITE_` is compiled into the public bundle, so nothing secret goes here.
3. Add the domain `codewithoutlimits.net` and let Netlify provision the certificate.
4. Confirm the SPA redirect is live: visit `https://codewithoutlimits.net/courses` directly. If
   you get a 404, the `/*  ->  /index.html  200` rule is not being applied.

**Checking the headers.** After the first deploy:

```bash
curl -sI https://codewithoutlimits.net | grep -iE 'content-security-policy|strict-transport|x-frame|referrer'
```

The `connect-src` directive is the one that earns its place. It limits the browser to talking to
`api.codewithoutlimits.net`, so a script that somehow gets onto the page cannot quietly post
learner data to an endpoint of its own choosing.

## 4. DNS

| Record | Host | Points to |
|---|---|---|
| A / ALIAS | `codewithoutlimits.net` | Netlify load balancer |
| CNAME | `www` | Netlify site subdomain |
| CNAME | `api` | Railway service domain |

Add a CAA record limiting certificate issuance to the authorities Netlify and Railway use. It
takes one line and it removes a whole category of misissuance risk.

## 5. Mobile

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
eas build --platform ios --profile production
```

Set the production API URL in `app.json` under `expo.extra.apiUrl` before building. Both
platforms are configured to refuse cleartext HTTP, so a build pointed at an `http://` URL will
fail to connect rather than silently sending credentials in the clear.

## 6. Post-deploy checklist

- [ ] `GET https://api.codewithoutlimits.net/api/health` returns `{"status":"ok"}`
- [ ] `curl -H 'Origin: https://evil.example' https://api.codewithoutlimits.net/api/catalogue` is refused
- [ ] Registration, sign-in, refresh and sign-out all work end to end on the deployed site
- [ ] A quiz response body contains no `answer` or `explanation` field before submission
- [ ] Netlify security headers are present
- [ ] An admin account exists (`npm run create-admin -w @cwl/api -- <email> "<name>"`)
- [ ] MongoDB backups are scheduled
