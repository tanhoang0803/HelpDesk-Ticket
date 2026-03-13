import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '../../common/enums/priority.enum';

export class CreateTicketDto {
  @ApiProperty({ example: 'VPN not working from home' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Cannot connect to VPN since this morning. Error: timeout' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsUUID()
  ticketTypeId: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
