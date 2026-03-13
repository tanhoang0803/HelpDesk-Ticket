import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiPropertyOptional({ description: 'Agent UUID. Null to return to queue.' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
