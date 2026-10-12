#!/usr/bin/env bash
# Quackie sign-in for realm "chimera": the quackie login theme, email as the login, Russian and
# English, and a nickname on sign-up in place of first and last name. Safe to run again.
#   ./setup-keycloak-quackie.sh            # this server (deploy/server)
#   ./setup-keycloak-quackie.sh ../..      # any other compose project, e.g. the local stack
set -euo pipefail
cd "${1:-$(dirname "$0")}"

ADMIN_PW=$(grep '^KEYCLOAK_ADMIN_PASSWORD=' .env | cut -d= -f2-)
kc() { docker compose exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"; }

kc config credentials --server http://localhost:8080 --realm master --user admin --password "$ADMIN_PW" >/dev/null

kc update realms/chimera -s loginTheme=quackie -s registrationEmailAsUsername=true \
  -s internationalizationEnabled=true -s 'supportedLocales=["ru","en"]' -s defaultLocale=ru

# Sign-up asks for email, nickname and password. First and last name stay on existing accounts
# but are no longer required; the nickname reaches the tokens through the "profile" scope's
# built-in nickname mapper.
kc get users/profile -r chimera | python3 -c '
import json, sys
profile = json.load(sys.stdin)
attributes = profile["attributes"]
for a in attributes:
    if a["name"] in ("firstName", "lastName"):
        a.pop("required", None)
if not any(a["name"] == "nickname" for a in attributes):
    after_email = next(i for i, a in enumerate(attributes) if a["name"] == "email") + 1
    attributes.insert(after_email, {
        "name": "nickname",
        "displayName": "${nickname}",
        "required": {"roles": ["user"]},
        "permissions": {"view": ["admin", "user"], "edit": ["admin", "user"]},
        "validations": {"length": {"min": 2, "max": 32}, "person-name-prohibited-characters": {}},
        "multivalued": False,
    })
json.dump(profile, sys.stdout)
' | kc update users/profile -r chimera -f -

# The nickname is required now, so Keycloak would stop existing accounts at their next login to
# ask for one. Give them their first name instead, or the username (an email's name part).
# With email as the username, saving an account also turns its username into its email: an old
# "demo" logs in as its email from then on, with the same password.
kc get users -r chimera -q briefRepresentation=false --limit 10000 | python3 -c '
import json, re, sys
for u in json.load(sys.stdin):
    if (u.get("attributes") or {}).get("nickname"):
        continue
    name = u.get("firstName") or u["username"].split("@")[0]
    name = re.sub(r"[<>&\"\x27$%!#?§;*~/\\|^=\[\]{}()]", "", name)[:32]
    if len(name) >= 2:
        print(u["id"], json.dumps([name], ensure_ascii=False))
' | while read -r id nickname; do
  # docker compose exec would otherwise read the rest of the list from this loop's stdin.
  kc update "users/$id" -r chimera -s "attributes.nickname=$nickname" < /dev/null
done

echo "realm chimera: quackie theme, email login, ru/en, nickname on sign-up"
