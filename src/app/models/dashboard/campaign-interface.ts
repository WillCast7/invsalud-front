import { BrandListInterface, BrandListInitializer } from "./brand-list-interface";

export interface CampaignInterface{
    id: number;
    name: string;
    initialDate: Date;
    finalDate: Date;
    campaignType: string[];
    customerTypes: string[];
    brands: BrandListInterface[];
    image: string;
    investment: number;
    details: string;
    otherCampaign: string;
    otherMarketingAssets: string;
    marketingAssets: string[];
    createdAt: Date;
    idMailchimpCampaign: string;
    createdBy: string;
    status: string;
}

export const CampaignInitializer: CampaignInterface ={
    id: 0,
    name: '',
    initialDate: new Date(),
    finalDate: new Date(),
    campaignType: [],
    customerTypes: [],
    brands: [BrandListInitializer],
    image: '',
     otherCampaign: '',
    otherMarketingAssets: '',
    investment: 0,
    details: '',
    marketingAssets: [],
    createdAt: new Date(),
    idMailchimpCampaign: '',
    createdBy: '',
    status: ''
}