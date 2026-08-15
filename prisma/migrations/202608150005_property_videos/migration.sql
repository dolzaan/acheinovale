-- Armazena vídeos vinculados aos imóveis, removendo os registros junto com o anúncio.
CREATE TABLE IF NOT EXISTS "PropertyVideo" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PropertyVideo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PropertyVideo_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyVideo_storageKey_key"
  ON "PropertyVideo"("storageKey");

CREATE INDEX IF NOT EXISTS "PropertyVideo_propertyId_position_idx"
  ON "PropertyVideo"("propertyId", "position");
