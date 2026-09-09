-- Track neighborhoods entered manually so administrators can review their spelling.
ALTER TABLE "bairros" ADD COLUMN "precisa_revisao" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "bairros_precisa_revisao_idx" ON "bairros"("precisa_revisao");
