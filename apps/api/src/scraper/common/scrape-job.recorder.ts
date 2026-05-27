import { PrismaService } from '@@db';
import { Prisma, ScrapeSource, ScrapeStatus } from '@@prisma';
import { Injectable } from '@nestjs/common';

interface TaskOutput<T> {
  result: T;
  diffSummary?: Prisma.InputJsonValue;
  /** 설정되면 SUCCESS 대신 SKIPPED로 기록. reason은 jobs.error 컬럼에 저장 */
  skipped?: { reason: string };
}

interface RunOptions<T> {
  source: ScrapeSource;
  target: string;
  task: () => Promise<TaskOutput<T>>;
}

@Injectable()
export class ScrapeJobRecorder {
  constructor(private readonly prismaService: PrismaService) {}

  async run<T>({ source, target, task }: RunOptions<T>): Promise<T> {
    const job = await this.prismaService.scrapeJob.create({
      data: { source, target, status: ScrapeStatus.RUNNING },
    });

    try {
      const { result, diffSummary, skipped } = await task();
      await this.prismaService.scrapeJob.update({
        where: { id: job.id },
        data: skipped
          ? {
              status: ScrapeStatus.SKIPPED,
              finishedAt: new Date(),
              error: skipped.reason.slice(0, 1000),
              diffSummary: diffSummary ?? undefined,
            }
          : {
              status: ScrapeStatus.SUCCESS,
              finishedAt: new Date(),
              diffSummary: diffSummary ?? undefined,
            },
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prismaService.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: ScrapeStatus.FAILED,
          finishedAt: new Date(),
          error: message.slice(0, 1000),
        },
      });
      throw error;
    }
  }

  async skip(source: ScrapeSource, target: string, reason: string): Promise<void> {
    await this.prismaService.scrapeJob.create({
      data: {
        source,
        target,
        status: ScrapeStatus.SKIPPED,
        finishedAt: new Date(),
        error: reason.slice(0, 1000),
      },
    });
  }
}
