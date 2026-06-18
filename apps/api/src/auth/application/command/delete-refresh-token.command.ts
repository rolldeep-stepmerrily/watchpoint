import { PrismaService } from '@@db';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

export class DeleteRefreshTokenCommand extends Command<void> {
  constructor(public readonly props: DeleteRefreshTokenCommandProps) {
    super();
  }
}

@CommandHandler(DeleteRefreshTokenCommand)
export class DeleteRefreshTokenCommandHandler implements ICommandHandler<DeleteRefreshTokenCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteRefreshTokenCommand): Promise<void> {
    const { token, userId } = command.props;

    await this.prisma.refreshToken.deleteMany({
      where: { token, ...(userId !== undefined && { userId }) },
    });
  }
}

interface DeleteRefreshTokenCommandProps {
  token: string;
  userId?: number;
}
