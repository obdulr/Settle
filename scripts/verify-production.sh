#!/usr/bin/env bash
# Settle In Peace — Production readiness smoke test
# Usage:
#   export API_URL=https://api.settleinpeace.com
#   export FRONTEND_URL=https://settleinpeace.com
#   ./scripts/verify-production.sh

set -e

API_URL=${API_URL:-https://api.settleinpeace.com}
FRONTEND_URL=${FRONTEND_URL:-https://settleinpeace.com}

echo "== Settle In Peace Production Smoke Test =="
echo "API:    $API_URL"
echo "Web:    $FRONTEND_URL"
echo ""

# 1. API is up
echo "[1/7] Checking API health..."
HTTP_STATUS=$(curl -s -o /tmp/health.json -w "%{http_code}" "$API_URL/health" || true)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "  FAIL: /health returned status $HTTP_STATUS"
  exit 1
fi
echo "  OK: /health is 200"

# 2. Key public pages are reachable
echo "[2/7] Checking public pages..."
for page in / /assessment /providers /coaching /disclosures /terms /privacy; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$page" || true)
  if [ "$STATUS" != "200" ]; then
    echo "  FAIL: $page returned $STATUS"
    exit 1
  fi
  echo "  OK: $page"
done

# 3. Stripe configuration presence (safe check — no secrets exposed)
echo "[3/7] Checking Stripe configuration is loaded..."
# The API will throw 500 on /stripe/webhook if STRIPE_SECRET_KEY is missing in production.
WEBHOOK_STATUS=$(curl -s -o /tmp/webhook.json -w "%{http_code}" -X POST "$API_URL/stripe/webhook" -H "Content-Type: application/json" -d '{}' || true)
if [ "$WEBHOOK_STATUS" = "500" ]; then
  echo "  FAIL: /stripe/webhook returned 500 — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET may be missing"
  exit 1
fi
# Without a valid signature it should return 400, not 500.
if [ "$WEBHOOK_STATUS" != "400" ]; then
  echo "  WARN: /stripe/webhook returned $WEBHOOK_STATUS (expected 400 for invalid signature)"
else
  echo "  OK: /stripe/webhook reachable and not crashing"
fi

# 4. Lead submission works (public endpoint)
echo "[4/7] Submitting test lead..."
LEAD_RESPONSE=$(curl -s -X POST "$API_URL/leads/assessment" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Smoke",
    "lastName":"Test",
    "email":"smoke-LEAD-ID@example.com",
    "phone":"5555555555",
    "state":"CA",
    "totalDebt":25000,
    "debtTypes":["credit_card"],
    "monthsBehind":3,
    "employmentStatus":"employed",
    "monthlyIncome":4000,
    "tcpaConsent":true
  }' || true)
echo "  Response: $LEAD_RESPONSE"
LEAD_ID=$(echo "$LEAD_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
if [ -z "$LEAD_ID" ]; then
  echo "  FAIL: Could not create lead"
  exit 1
fi
echo "  OK: Created lead $LEAD_ID"

# 5. Matching works
echo "[5/7] Checking matches for lead $LEAD_ID..."
MATCH_STATUS=$(curl -s -o /tmp/matches.json -w "%{http_code}" "$API_URL/matching/recommended/$LEAD_ID" || true)
if [ "$MATCH_STATUS" != "200" ]; then
  echo "  FAIL: /matching/recommended/$LEAD_ID returned $MATCH_STATUS"
  exit 1
fi
echo "  OK: Matching endpoint responded"

# 6. Provider signup works (public endpoint)
echo "[6/7] Creating test provider..."
PROVIDER_RESPONSE=$(curl -s -X POST "$API_URL/providers/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName":"Smoke Test Provider",
    "email":"smoke-PROVIDER-ID@example.com",
    "password":"SmokeTest123!",
    "phone":"5555555556",
    "website":"https://example.com",
    "serviceTypes":["debt_settlement"],
    "debtTypes":["credit_card"],
    "statesServed":["CA"],
    "minDebtAmount":5000,
    "maxDebtAmount":100000,
    "feePercentage":20
  }' || true)
echo "  Response: $PROVIDER_RESPONSE"
PROVIDER_ID=$(echo "$PROVIDER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)
if [ -z "$PROVIDER_ID" ]; then
  echo "  FAIL: Could not create provider"
  exit 1
fi
echo "  OK: Created provider $PROVIDER_ID"

# 7. Stripe checkout session for credits can be created (requires provider approval + auth, so this is a sanity call)
echo "[7/7] Checking Stripe checkout session creation (requires active provider auth)..."
echo "  INFO: To fully verify Stripe, log in as the test provider, approve it via /admin/providers/$PROVIDER_ID/approve,"
echo "        then POST /stripe/checkout with {\"credits\":500}."

echo ""
echo "== Smoke test passed up to public-flow checks =="
echo "Next: approve the test provider and run a credit/coaching checkout to confirm Stripe webhook fulfillment."
