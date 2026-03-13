import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentRole } from '../../common/enums/agent-role.enum';

export class CreateAgentDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@helpdesk.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsUUID()
  departmentId: string;

  @ApiPropertyOptional({ enum: AgentRole, default: AgentRole.AGENT })
  @IsEnum(AgentRole)
  @IsOptional()
  role?: AgentRole;
}
