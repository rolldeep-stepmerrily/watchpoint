import { PrismaService } from '@@db';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

export class CreateOAuthAccountCommand extends Command<void> {
  constructor(public readonly props: CreateOAuthAccountCommandProps) {
    super();
  }
}

@CommandHandler(CreateOAuthAccountCommand)
export class CreateOAuthAccountCommandHandler implements ICommandHandler<CreateOAuthAccountCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateOAuthAccountCommand): Promise<void> {
    const { userId, provider, providerAccountId, accessToken } = command.props;

    await this.prisma.oAuthAccount.create({
      data: { userId, provider, providerAccountId, accessToken },
    });
  }
}

interface CreateOAuthAccountCommandProps {
  userId: number;
  provider: string;
  providerAccountId: string;
  accessToken: string;
}
