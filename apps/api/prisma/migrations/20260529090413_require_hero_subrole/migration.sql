-- CreateEnum: Subrole — Hero.subrole을 String?에서 enum NOT NULL로 전환
CREATE TYPE "Subrole" AS ENUM ('Bruiser', 'Initiator', 'Stalwart', 'Sharpshooter', 'Flanker', 'Specialist', 'Recon', 'Tactician', 'Medic', 'Survivor');

-- 안전 가드: 기존 데이터에 enum 값과 일치하지 않거나 NULL인 row가 있으면 실패시킨다.
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM "heroes"
  WHERE "subrole" IS NULL
     OR "subrole" NOT IN ('Bruiser', 'Initiator', 'Stalwart', 'Sharpshooter', 'Flanker', 'Specialist', 'Recon', 'Tactician', 'Medic', 'Survivor');
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce Subrole NOT NULL: % rows have null or invalid subrole', bad_count;
  END IF;
END $$;

-- AlterTable: 기존 String 컬럼을 enum으로 USING 캐스팅 + NOT NULL.
ALTER TABLE "heroes"
  ALTER COLUMN "subrole" TYPE "Subrole" USING "subrole"::"Subrole",
  ALTER COLUMN "subrole" SET NOT NULL;
