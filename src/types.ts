export interface Contact {
  email: string;
  name: string;
}

export interface MailFolder {
  id: string;
  name: string;
  unreadCount: number;
}

export interface MailAccount {
  email: string;
  folders: MailFolder[];
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface MailMessage {
  id: string;
  from: Contact;
  to: Contact[];
  body: string;
  date: string;
  attachments?: Attachment[];
}

export interface MailThread {
  id: string;
  folderId: string;
  subject: string;
  read: boolean;
  messages: MailMessage[];
}
