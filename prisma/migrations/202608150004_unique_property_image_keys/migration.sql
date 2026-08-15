-- Impede que o mesmo arquivo do Storage seja vinculado a mais de um imóvel.
CREATE UNIQUE INDEX IF NOT EXISTS "PropertyImage_storageKey_key"
  ON "PropertyImage"("storageKey");
