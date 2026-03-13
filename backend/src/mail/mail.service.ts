import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:   this.config.get('MAIL_HOST', 'smtp.gmail.com'),
      port:   Number(this.config.get('MAIL_PORT', '587')),
      secure: this.config.get('MAIL_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get('MAIL_USER', ''),
        pass: this.config.get('MAIL_PASS', ''),
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    const from = this.config.get('MAIL_FROM', 'HelpDesk <noreply@helpdesk.local>');
    try {
      await this.transporter.sendMail({ from, to, subject, html });
    } catch (err) {
      this.logger.warn(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendTicketCreated(opts: {
    to: string;
    ticketNumber: string;
    title: string;
    priority: string;
  }) {
    await this.send(
      opts.to,
      `[${opts.ticketNumber}] Ticket Created: ${opts.title}`,
      `<p>Your ticket <strong>${opts.ticketNumber}</strong> has been created.</p>
       <p><strong>Title:</strong> ${opts.title}<br>
          <strong>Priority:</strong> ${opts.priority}</p>
       <p>You will be notified when it is updated.</p>`,
    );
  }

  async sendTicketAssigned(opts: {
    to: string;
    ticketNumber: string;
    title: string;
    agentName: string;
  }) {
    await this.send(
      opts.to,
      `[${opts.ticketNumber}] Ticket Assigned to ${opts.agentName}`,
      `<p>Ticket <strong>${opts.ticketNumber}</strong> — <em>${opts.title}</em> has been assigned to <strong>${opts.agentName}</strong>.</p>`,
    );
  }

  async sendStatusChanged(opts: {
    to: string;
    ticketNumber: string;
    title: string;
    newStatus: string;
    comment?: string;
  }) {
    await this.send(
      opts.to,
      `[${opts.ticketNumber}] Status Updated: ${opts.newStatus}`,
      `<p>Ticket <strong>${opts.ticketNumber}</strong> — <em>${opts.title}</em> status changed to <strong>${opts.newStatus}</strong>.</p>
       ${opts.comment ? `<p><strong>Comment:</strong> ${opts.comment}</p>` : ''}`,
    );
  }

  async sendCommentAdded(opts: {
    to: string;
    ticketNumber: string;
    title: string;
    comment: string;
    agentName: string;
  }) {
    await this.send(
      opts.to,
      `[${opts.ticketNumber}] New Comment on Your Ticket`,
      `<p><strong>${opts.agentName}</strong> commented on ticket <strong>${opts.ticketNumber}</strong> — <em>${opts.title}</em>:</p>
       <blockquote style="border-left:4px solid #ccc;padding-left:12px;">${opts.comment}</blockquote>`,
    );
  }
}
