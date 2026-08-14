-- Amplia o perfil sem remover ou reescrever dados existentes.
ALTER TABLE "User"
ADD COLUMN "authProvider" TEXT,
ADD COLUMN "providerId" TEXT,
ADD COLUMN "cityId" TEXT;

CREATE UNIQUE INDEX "User_authProvider_providerId_key"
ON "User"("authProvider", "providerId");

CREATE INDEX "User_cityId_idx" ON "User"("cityId");

ALTER TABLE "User"
ADD CONSTRAINT "User_cityId_fkey"
FOREIGN KEY ("cityId") REFERENCES "City"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
