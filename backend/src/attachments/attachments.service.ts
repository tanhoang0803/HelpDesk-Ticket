import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AttachmentsRepository } from './attachments.repository';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AgentRole } from '../common/enums/agent-role.enum';

@Injectable()
export class AttachmentsService {
  constructor(private repo: AttachmentsRepository) {}

  async upload(
    ticketId: string,
    file: Express.Multer.File,
    currentUser: JwtPayload,
  ) {
    return this.repo.create({
      ticketId,
      uploadedById: currentUser.sub,
      filename:     file.filename,
      originalName: file.originalname,
      mimeType:     file.mimetype,
      size:         file.size,
    });
  }

  findByTicket(ticketId: string) {
    return this.repo.findByTicketId(ticketId);
  }

  async getFilePath(id: string) {
    const attachment = await this.repo.findById(id);
    if (!attachment) throw new NotFoundException('Attachment not found');
    return {
      attachment,
      filePath: path.join(process.cwd(), 'uploads', attachment.filename),
    };
  }

  async remove(id: string, currentUser: JwtPayload) {
    const attachment = await this.repo.findById(id);
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (
      attachment.uploadedById !== currentUser.sub &&
      currentUser.role !== AgentRole.ADMIN
    ) {
      throw new ForbiddenException('You can only delete your own attachments');
    }

    const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return this.repo.delete(id);
  }
}
