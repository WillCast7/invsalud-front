import { EmailTemplateInitializer, EmailTemplateInterface } from "./email-template-interface";

export interface MailchimpCampaignLocalDBInterface{
    id: number;
    campaignId: string;
    subjectLine: string;
    title: string;
    fromName: string;
    replyTo: string;
    toName: string;
    template: EmailTemplateInterface;
    creationDate: Date;
    createdBy: string;
}

export const MailchimpCampaignLocalDBInitializer: MailchimpCampaignLocalDBInterface ={
    id: 0,
    campaignId: '',
    subjectLine: '',
    title: '',
    fromName: '',
    replyTo: '',
    toName: '',
    template: EmailTemplateInitializer,
    creationDate: new Date(),
    createdBy: ''
}