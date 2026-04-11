export interface Contact {
  email: string;
  name: string;
}

export interface MailFolder {
  id: string;
  name: string;
}

export interface MailAccount {
  email: string;
  folders: MailFolder[];
}

export interface MailMessage {
  id: string;
  from: Contact;
  to: Contact[];
  body: string;
  date: string;
}

export interface MailThread {
  id: string;
  folderId: string;
  subject: string;
  read: boolean;
  messages: MailMessage[];
}
