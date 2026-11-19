import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transport: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.transport = createTransport({
      host: config.getOrThrow<string>('mail.host'),
      port: config.getOrThrow<number>('mail.port'),
    });
    this.from = config.getOrThrow<string>('mail.from');
  }

  async send(to: string, subject: string, html: string) {
    await this.transport.sendMail({ from: this.from, to, subject, html });
  }
}
