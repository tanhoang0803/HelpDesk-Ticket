import {
  Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors,
  UploadedFile, ParseUUIDPipe, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Post('tickets/:id/attachments')
  @ApiOperation({ summary: 'Upload a file attachment to a ticket' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  }))
  upload(
    @Param('id', ParseUUIDPipe) ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.upload(ticketId, file, user);
  }

  @Get('tickets/:id/attachments')
  @ApiOperation({ summary: 'List attachments for a ticket' })
  findByTicket(@Param('id', ParseUUIDPipe) ticketId: string) {
    return this.attachmentsService.findByTicket(ticketId);
  }

  @Get('attachments/:id/download')
  @ApiOperation({ summary: 'Download an attachment' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { attachment, filePath } = await this.attachmentsService.getFilePath(id);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attachment' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.remove(id, user);
  }
}
