import { Module } from '@nestjs/common';
import { GetLatestPatchNoteQueryHandler } from './application/queries/get-latest-patch-note.query';
import { GetPatchNoteByVersionQueryHandler } from './application/queries/get-patch-note-by-version.query';
import { GetPatchNoteListQueryHandler } from './application/queries/get-patch-note-list.query';
import { GetLatestPatchNoteUseCase } from './application/use-cases/get-latest-patch-note.use-case';
import { GetPatchNoteEntriesUseCase } from './application/use-cases/get-patch-note-entries.use-case';
import { GetPatchNoteListUseCase } from './application/use-cases/get-patch-note-list.use-case';
import { GetPatchNoteUseCase } from './application/use-cases/get-patch-note.use-case';
import { PatchNoteHttpController } from './presenter/http/patch-note.http.controller';

@Module({
  controllers: [PatchNoteHttpController],
  providers: [
    /** query-handlers */
    GetLatestPatchNoteQueryHandler,
    GetPatchNoteByVersionQueryHandler,
    GetPatchNoteListQueryHandler,

    /** use-cases */
    GetLatestPatchNoteUseCase,
    GetPatchNoteEntriesUseCase,
    GetPatchNoteListUseCase,
    GetPatchNoteUseCase,
  ],
})
export class PatchNoteModule {}
