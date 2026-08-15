-- Registra decisões de moderação sem alterar ou remover anúncios existentes.
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "moderationNote" TEXT,
  ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "moderatedById" TEXT;

ALTER TABLE "FreighterProfile"
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "moderationNote" TEXT,
  ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "moderatedById" TEXT;

CREATE INDEX IF NOT EXISTS "Property_status_createdAt_idx"
  ON "Property"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Property_moderatedById_idx"
  ON "Property"("moderatedById");
CREATE INDEX IF NOT EXISTS "FreighterProfile_status_createdAt_idx"
  ON "FreighterProfile"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "FreighterProfile_moderatedById_idx"
  ON "FreighterProfile"("moderatedById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Property_moderatedById_fkey'
  ) THEN
    ALTER TABLE "Property"
      ADD CONSTRAINT "Property_moderatedById_fkey"
      FOREIGN KEY ("moderatedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FreighterProfile_moderatedById_fkey'
  ) THEN
    ALTER TABLE "FreighterProfile"
      ADD CONSTRAINT "FreighterProfile_moderatedById_fkey"
      FOREIGN KEY ("moderatedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- O primeiro usuário do projeto é o proprietário inicial do marketplace.
-- A promoção só ocorre quando ainda não existe nenhum administrador.
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "id" = (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM "User" WHERE "role" = 'ADMIN'
);
