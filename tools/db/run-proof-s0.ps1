$ErrorActionPreference = "Stop"

$DB_CONTAINER = docker ps --format "{{.Names}}" | Where-Object { $_ -like "supabase_db_*" } | Select-Object -First 1
if (-not $DB_CONTAINER) { throw "Supabase DB container not found." }

cmd /c "docker exec -i $DB_CONTAINER psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase\tests\s0_toc_projection_contract.sql"
