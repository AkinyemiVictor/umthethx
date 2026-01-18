import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET;

if (
  !region ||
  !bucket ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY
) {
  console.error(
    "Missing env vars. Need AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
  );
  process.exit(1);
}

const s3 = new S3Client({ region });

async function main() {
  const prefix = "temp/sanity-check/";

  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 5 })
  );
  console.log("ListObjects ok. Found:", list.KeyCount ?? 0);

  const key = `${prefix}${Date.now()}-hello.txt`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: "hello from umthethx",
      ContentType: "text/plain",
    })
  );
  console.log("PutObject ok:", key);

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 300 }
  );
  console.log("Presigned GET (5 mins):", url);
}

main().catch((e) => {
  console.error("S3 test failed:", e?.name || e, e?.message || "");
  process.exit(1);
});
