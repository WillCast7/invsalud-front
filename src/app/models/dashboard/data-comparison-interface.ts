export interface DataComparisonInterface {
    after30: number;
    after60:number;
    after90:number;
    after120:number;
    before30:number;
    before60:number;
    before90:number;
    before120:number;
    campaign:number;
}

export const DataComparisonInitializer: DataComparisonInterface = {
    after30: 0,
    after60: 0,
    after90: 0,
    after120: 0,
    before30: 0,
    before60: 0,
    before90: 0,
    before120: 0,
    campaign: 0
}
