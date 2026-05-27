export interface DocumentTemplate {
    id?: string;
    name: string;
    documentType: string;
    category: string;
    htmlContent: string;
    cssContent?: string;
    grapesState: any; // Using any or string to accommodate JSONB parsing
    isActive?: boolean;
    version?: number;
}
