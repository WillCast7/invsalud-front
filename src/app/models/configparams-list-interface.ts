import { ConfigparamsInitializer, ConfigparamsInterface } from "./configparams-interface";

export interface ConfigparamsListInterface {
    contactResult: ConfigparamsInterface[];
    customerResponse: ConfigparamsInterface[];
    customerPreference: ConfigparamsInterface[];
    customerTopic: ConfigparamsInterface[];
    paymentMethod: ConfigparamsInterface[];
    documentType: ConfigparamsInterface[];
    position: ConfigparamsInterface[];
    callcenterStep: ConfigparamsInterface[];
}

export const ConfigparamsListInitializer: ConfigparamsListInterface = {
    contactResult: [ConfigparamsInitializer],
    customerResponse: [ConfigparamsInitializer],
    customerPreference: [ConfigparamsInitializer],
    customerTopic: [ConfigparamsInitializer],
    paymentMethod: [ConfigparamsInitializer],
    documentType: [ConfigparamsInitializer],
    position: [ConfigparamsInitializer],
    callcenterStep: [ConfigparamsInitializer]
}