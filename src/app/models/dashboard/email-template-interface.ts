import { CampaignInterface } from "../mercadeo/campaign-interface";

export interface EmailTemplateInterface{
    id : number;
    name: string;
    folderTemplateId: string;
    html: string;
    css: string;
    mailchimpId: number;
    campaigns: CampaignInterface[];
}

export const EmailTemplateInitializer: EmailTemplateInterface ={
    id: 0,
    name: '',
    folderTemplateId: '',
    html: '',
    css: '',
    mailchimpId: 0,
    campaigns: []
}