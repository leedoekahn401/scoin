import { createTransport, type Transporter } from 'nodemailer';
import { config } from '../../config';

export class MailService {
  private readonly transport: Transporter;
  private readonly from: string;

  constructor(mail: { host: string; port: number; from: string }) {
    this.transport = createTransport({ host: mail.host, port: mail.port });
    this.from = mail.from;
  }

  async send(to: string, subject: string, html: string) {
    await this.transport.sendMail({ from: this.from, to, subject, html });
  }
}

export const mailService = new MailService(config.mail);
