import { PrismaService } from '@@db';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

export class UpdateOAuthAccountAccessTokenCommand extends Command<void> {
  constructor(public readonly props: UpdateOAuthAccountAccessTokenCommandProps) {
    super();
  }
}

@CommandHandler(UpdateOAuthAccountAccessTokenCommand)
export class UpdateOAuthAccountAccessTokenCommandHandler
  implements ICommandHandler<UpdateOAuthAccountAccessTokenCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateOAuthAccountAccessTokenCommand): Promise<void> {
    const { id, accessToken } = command.props;

    await this.prisma.oAuthAccount.update({
      where: { id },
      data: { accessToken },
    });
  }
}

interface UpdateOAuthAccountAccessTokenCommandProps {
  id: number;
  accessToken: string;
}
