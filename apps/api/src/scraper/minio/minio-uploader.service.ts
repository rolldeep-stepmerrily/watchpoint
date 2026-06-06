import { readFile } from 'node:fs/promises';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CONTENT_TYPE_BY_EXT: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
};

/**
 * MinIO(S3 호환) bucket에 파일 업로드 + 공개 URL 반환.
 *
 * - `forcePathStyle: true` — MinIO는 path-style URL을 권장.
 * - `MINIO_PUBLIC_URL` 비어있으면 `${endpoint}/${bucket}` 으로 fallback. 커스텀 도메인/CDN을 쓰면
 *   해당 URL을 base로 지정해 두는 게 깔끔.
 * - ACL은 명시하지 않음 — MinIO는 bucket policy(public-read)로 일괄 노출하는 게 일반적.
 */
@Injectable()
export class MinioUploader {
  private readonly logger = new Logger(MinioUploader.name);
  private cachedClient: { client: S3Client; bucket: string; publicUrlBase: string } | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * MinIO env가 모두 채워졌을 때만 client를 생성. CLI에서 assets:upload를 호출할 때 처음 평가되므로,
   * env 없는 환경에서도 모듈 로딩은 정상 동작한다.
   */
  private resolveClient(): { client: S3Client; bucket: string; publicUrlBase: string } {
    if (this.cachedClient) {
      return this.cachedClient;
    }
    const endpoint = this.config.getOrThrow<string>('MINIO_ENDPOINT');
    const accessKeyId = this.config.getOrThrow<string>('MINIO_ACCESS_KEY');
    const secretAccessKey = this.config.getOrThrow<string>('MINIO_SECRET_KEY');
    const bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    const publicUrlBase = (this.config.get<string>('MINIO_PUBLIC_URL') ?? `${endpoint}/${bucket}`).replace(/\/$/, '');

    const client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    this.cachedClient = { client, bucket, publicUrlBase };
    return this.cachedClient;
  }

  publicUrlFor(key: string): string {
    return `${this.resolveClient().publicUrlBase}/${key}`;
  }

  async uploadFile(localPath: string, key: string): Promise<string> {
    const { client, bucket, publicUrlBase } = this.resolveClient();
    const body = await readFile(localPath);
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    const contentType = CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream';

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    this.logger.log(`uploaded s3://${bucket}/${key} (${body.byteLength} bytes)`);
    return `${publicUrlBase}/${key}`;
  }
}
