-- Correções da auditoria de segurança de 27/11/2026.
-- Idempotente: o build de produção reaplica este arquivo.

-- 1) Tabelas do schema public sem RLS ficavam abertas para a chave pública (PostgREST).
--    O app acessa o banco só pelo Prisma (dono das tabelas), que não é afetado.
ALTER TABLE "metricas_diarias_freteiros" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) O dono podia sobrescrever uma foto ou vídeo depois que o servidor já tinha conferido
--    o arquivo, burlando a checagem de tipo e tamanho. Os envios do site nunca sobrescrevem
--    (upsert: false), então a regra de UPDATE não é necessária.
--    A regra de DELETE continua: o navegador apaga os próprios arquivos quando um envio falha.
DROP POLICY IF EXISTS "Users update marketplace images in their own folder" ON storage.objects;

-- 3) Fotos de perfil só são enviadas pelo servidor (chave de serviço, com checagem do
--    conteúdo). As regras que deixavam o navegador gravar direto no bucket não são usadas.
DROP POLICY IF EXISTS "Users upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete their own profile images" ON storage.objects;
