export type WalletType = string;
export type TransactionType = '수입' | '지출';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  wallet: WalletType;
  category: string;
  subCategory: string;
  amount: number;
  description: string;
  targetId?: string; // 목장 등 특정 엔티티 ID
}

export interface Member {
  id: string;
  name: string;
  status: '활동' | '비활동';
  duesPaid: Record<string, boolean>; // ex: { "2026-01": true }
}

export interface SpecialBudget {
  id: string; // 'pastor_visit'
  name: string; // '목사님 심방비'
  quarterlyLimit: number;
  yearlyLimit: number;
}

export type OrgType = string;

export interface OrgBudgetLimit {
  id: string; // 예: 'visit', 'dinner', 'operation'
  categoryName: string; // 예: "심방비", "회식비", "운영비"
  halfYearlyLimit: number; // 반기 한도 (0이면 미적용)
  yearlyLimit: number;     // 연간 한도 (0이면 미적용)
}

export interface OrganizationGroup {
  id: string;
  name: string;      // 예: "1목장", "임원진", "새가족팀"
  type: OrgType;
  budgets: OrgBudgetLimit[];
}

export interface CategoryNode {
  id: string;
  name: string;
  subCategories: string[];
  defaultWallet: WalletType;
  isWalletLocked: boolean;
  requireTarget?: 'none' | 'pastor' | 'smallGroup';
}

export interface CategoryTree {
  INCOME: CategoryNode[];
  EXPENSE: CategoryNode[];
}

export interface BudgetConfig {
  year: number;
  totalBudget: number;
  specialBudgets: SpecialBudget[];
  organizations: OrganizationGroup[];
}
