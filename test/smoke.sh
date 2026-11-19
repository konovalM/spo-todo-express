#!/usr/bin/env bash
# Проверка HTTP-контракта. Запуск:
#   BASE=http://127.0.0.1:3000 TOKEN=<token> bash test/smoke.sh
set -u

BASE="${BASE:-http://127.0.0.1:3000}"
TOKEN="${TOKEN:-}"
RUN="smoke-$(date +%s)"
PASS=0; FAIL=0

# check <описание> <ожидаемый код> <фактический код>
check() {
  if [ "$2" = "$3" ]; then
    echo "  OK   [$3] $1"; PASS=$((PASS+1))
  else
    echo "  FAIL [got $3, want $2] $1"; FAIL=$((FAIL+1))
  fi
}

code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
body() { curl -s "$@"; }
AUTH=(-H "Authorization: Bearer $TOKEN")
JSON=(-H 'Content-Type: application/json')

echo "BASE=$BASE  RUN=$RUN"

check "GET /login/ без токена -> 200" 200 "$(code "$BASE/login/")"
check "GET /api/author/ без токена -> 401" 401 "$(code "$BASE/api/author/")"
check "GET /api/author/ с токеном -> 200" 200 "$(code "${AUTH[@]}" "$BASE/api/author/")"
check "GET /api/tasks/ без runId -> 400" 400 "$(code "${AUTH[@]}" "$BASE/api/tasks/")"
check "GET /api/tasks/ пустой -> 200" 200 "$(code "${AUTH[@]}" "$BASE/api/tasks/?runId=$RUN")"

# POST создать: один запрос, из него берём и статус, и тело.
CREATED=$(curl -s -w $'\n%{http_code}' "${AUTH[@]}" "${JSON[@]}" \
  -d "{\"title\":\"  задача 1  \",\"runId\":\"$RUN\"}" "$BASE/api/tasks/")
CODE=$(printf '%s' "$CREATED" | tail -n1)
JSON_BODY=$(printf '%s' "$CREATED" | sed '$d')
ID=$(printf '%s' "$JSON_BODY" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
check "POST /api/tasks/ -> 201" 201 "$CODE"
[ "$CODE" = 201 ] || echo "    body: $JSON_BODY"
echo "  created id=$ID; done-field: $(printf '%s' "$JSON_BODY" | grep -o '"done":[a-z]*'); trim: $(printf '%s' "$JSON_BODY" | grep -o '"title":"[^"]*"')"

check "POST лишнее поле -> 400" 400 "$(code "${AUTH[@]}" "${JSON[@]}" -d "{\"title\":\"x\",\"runId\":\"$RUN\",\"done\":true}" "$BASE/api/tasks/")"
check "POST пустой title -> 400" 400 "$(code "${AUTH[@]}" "${JSON[@]}" -d "{\"title\":\"   \",\"runId\":\"$RUN\"}" "$BASE/api/tasks/")"
check "POST битый runId -> 400" 400 "$(code "${AUTH[@]}" "${JSON[@]}" -d "{\"title\":\"x\",\"runId\":\"bad id!\"}" "$BASE/api/tasks/")"
check "POST битый JSON -> 400" 400 "$(code "${AUTH[@]}" "${JSON[@]}" -d '{bad' "$BASE/api/tasks/")"

check "GET /api/tasks/:id/ -> 200" 200 "$(code "${AUTH[@]}" "$BASE/api/tasks/$ID/")"
check "GET несуществующий uuid -> 404" 404 "$(code "${AUTH[@]}" "$BASE/api/tasks/00000000-0000-0000-0000-000000000000/")"
check "GET невалидный uuid -> 400" 400 "$(code "${AUTH[@]}" "$BASE/api/tasks/not-a-uuid/")"

check "PATCH done=true -> 200" 200 "$(code -X PATCH "${AUTH[@]}" "${JSON[@]}" -d '{"done":true}' "$BASE/api/tasks/$ID/")"
check "PATCH пустое тело -> 400" 400 "$(code -X PATCH "${AUTH[@]}" "${JSON[@]}" -d '{}' "$BASE/api/tasks/$ID/")"
check "PATCH несуществующий -> 404" 404 "$(code -X PATCH "${AUTH[@]}" "${JSON[@]}" -d '{"done":true}' "$BASE/api/tasks/00000000-0000-0000-0000-000000000000/")"

check "DELETE -> 204" 204 "$(code -X DELETE "${AUTH[@]}" "$BASE/api/tasks/$ID/")"
check "DELETE повторно -> 404" 404 "$(code -X DELETE "${AUTH[@]}" "$BASE/api/tasks/$ID/")"

echo "-----"
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = 0 ]
