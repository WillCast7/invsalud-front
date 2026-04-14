

export interface emailTemplateInterface {
    id: number;
    name: string;
    active: boolean;
    content_type: string;
    thumbnail: string;
}

export const emailTemplateInitializer: emailTemplateInterface = {
    id: 0,
    name: '',
    active: false,
    content_type: '',
    thumbnail: ''
};
