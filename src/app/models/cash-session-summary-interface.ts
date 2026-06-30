

export interface CashSessionSummaryInterface {
    netBalance: number,
    initialAmount: number,
    totalExpense: number,
    totalIncome: number,
    netCashBalance: number,
    purchasesMedicines?: number,
    purchasesMedicinesSp?: number,
    purchasesRecipes?: number,
    quotesMedicines?: number,
    quotesMedicinesSp?: number,
    quotesRecipes?: number,
    salesMedicines?: number,
    salesMedicinesSp?: number,
    salesRecipes?: number
};

export const cashSessionSummaryExample: CashSessionSummaryInterface = {
    netBalance: 0,
    initialAmount: 0,
    totalExpense: 0,
    totalIncome: 0,
    netCashBalance: 0,
    purchasesMedicines: 0,
    purchasesMedicinesSp: 0,
    purchasesRecipes: 0,
    quotesMedicines: 0,
    quotesMedicinesSp: 0,
    quotesRecipes: 0,
    salesMedicines: 0,
    salesMedicinesSp: 0,
    salesRecipes: 0
};