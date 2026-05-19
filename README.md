# Pre-Validation Readiness Interrogator

An AI-powered readiness check that determines whether a founder truly understands what they are getting into before they begin market validation. Founders complete a 10-phase interrogation and receive a structured readiness verdict.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Shaazamaan/prevalidation-test)

## Setup

1. Clone this repo
2. In Vercel dashboard: add a **Vercel KV** store and connect it to your project
3. Add the following environment variables in your Vercel project settings:

```
OPENROUTER_API_KEY=sk-or-...
NEXTAUTH_SECRET=<32-char random string>
NEXTAUTH_URL=https://your-vercel-deployment.vercel.app
ADMIN_USERNAME=Shaaz
ADMIN_PASSWORD=<your password>
KV_URL=<from Vercel KV>
KV_REST_API_URL=<from Vercel KV>
KV_REST_API_TOKEN=<from Vercel KV>
```

4. Deploy

## Usage

- Share the root URL (`/`) with founders
- Admin login at `/admin`

## Security

The interrogation system prompt is stored server-only (`lib/prompt.ts` uses the `server-only` package) and is never exposed in any API response.
