-- Track neighborhoods entered manually so administrators can review their spelling.
ALTER TABLE "bairros" ADD COLUMN IF NOT EXISTS "precisa_revisao" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "bairros_precisa_revisao_idx" ON "bairros"("precisa_revisao");
