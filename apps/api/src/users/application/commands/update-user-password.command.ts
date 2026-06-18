import { PrismaService } from '@@db';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

export class UpdateUserPasswordCommand extends Command<void> {
  constructor(public readonly props: UpdateUserPasswordCommandProps) {
    super();
  }
}

@CommandHandler(UpdateUserPasswordCommand)
export class UpdateUserPasswordCommandHandler implements ICommandHandler<UpdateUserPasswordCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserPasswordCommand): Promise<void> {
    const { userId, hashedPassword } = command.props;

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

interface UpdateUserPasswordCommandProps {
  userId: number;
  hashedPassword: string;
}
