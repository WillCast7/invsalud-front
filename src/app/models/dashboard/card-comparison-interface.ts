export interface CardComparisonInterface {
    title: string,
    amountBefore: number,
    amountAfter: number,
    background: string,
    icon: string,
    percentage: string,
    color: string
}

export const CardComparisonInitializer: CardComparisonInterface = {
    title: '',
    amountBefore: 0,
    amountAfter: 0,
    background: '',
    icon: '',
    percentage: '',
    color: ''
}
