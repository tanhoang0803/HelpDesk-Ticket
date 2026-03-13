import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CommentTicketDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment: string;
}
