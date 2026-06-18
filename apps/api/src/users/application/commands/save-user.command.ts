import { PrismaService } from '@@db';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UserEntity } from '../../entities/user.entity';

export class SaveUserCommand extends Command<UserEntity> {
  constructor(public readonly props: SaveUserCommandProps) {
    super();
  }
}

@CommandHandler(SaveUserCommand)
export class SaveUserCommandHandler implements ICommandHandler<SaveUserCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SaveUserCommand): Promise<UserEntity> {
    const { email, password, name } = command.props;

    return (await this.prisma.user.create({
      data: { email, password, name },
    })) as UserEntity;
  }
}

interface SaveUserCommandProps {
  email: string;
  password: string;
  name?: string;
}
