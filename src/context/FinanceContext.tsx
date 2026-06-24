import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Transaction, Member, BudgetConfig, CategoryTree } from '../types';

interface FinanceContextType {
  transactions: Transaction[];
  members: Member[];
  budgetConfig: BudgetConfig;
  categoryTree: CategoryTree;
  addTransaction: (transaction: Transaction) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, transaction: Transaction) => void;
  updateTransactions: (transactions: Transaction[]) => void;
  deleteTransaction: (id: string) => void;
  updateBudgetConfig: (config: BudgetConfig) => void;
  updateMember: (id: string, member: Member) => void;
  addMember: (member: Member) => void;
  updateCategoryTree: (tree: CategoryTree) => void;
  wallets: string[];
  addWallet: (name: string) => void;
  renameWallet: (oldName: string, newName: string) => void;
  deleteWallet: (name: string) => void;
  updateWallets: (wallets: string[]) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// LocalStorage Helper
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const DEFAULT_CATEGORY_TREE: CategoryTree = {
  INCOME: [
    { id: 'inc_1', name: '이월금', subCategories: ['전년도 이월금'], defaultWallet: '회비', isWalletLocked: false },
    { id: 'inc_2', name: '찬조금', subCategories: ['성도 후원', '외부 찬조'], defaultWallet: '회비', isWalletLocked: false },
    { id: 'inc_3', name: '수련회비', subCategories: ['수련회 등록비'], defaultWallet: '회비', isWalletLocked: false },
    { id: 'inc_4', name: '일반 회비', subCategories: ['월정 회비'], defaultWallet: '회비', isWalletLocked: false },
    { id: 'inc_5', name: '수련회 지원', subCategories: ['교회 지원금'], defaultWallet: '교부금', isWalletLocked: false },
    { id: 'inc_6', name: '사역 지원', subCategories: ['교회 지원금'], defaultWallet: '교부금', isWalletLocked: false }
  ],
  EXPENSE: [
    { id: 'exp_1', name: '축하/격려', subCategories: ['생일', '졸업/입학', '간식'], defaultWallet: '회비', isWalletLocked: true },
    { id: 'exp_2', name: '경조사비', subCategories: ['결혼', '장례', '출산'], defaultWallet: '회비', isWalletLocked: true },
    { id: 'exp_3', name: '수련회', subCategories: ['진행비', '식대', '강사비', '숙박비'], defaultWallet: '교부금', isWalletLocked: false },
    { id: 'exp_4', name: '예배', subCategories: ['주보', '성찬', '데코'], defaultWallet: '교부금', isWalletLocked: true },
    { id: 'exp_5', name: '훈련', subCategories: ['교재비', '수료증'], defaultWallet: '교부금', isWalletLocked: true },
    { id: 'exp_6', name: '심방/목양', subCategories: ['목사님 심방비'], defaultWallet: '교부금', isWalletLocked: true, requireTarget: 'pastor' },
    { id: 'exp_7', name: '목장/팀', subCategories: ['목장 회식비', '목장 심방비', '다과/심방비', '운영비', '목장 지원금', '기타 모임 지원'], defaultWallet: '교부금', isWalletLocked: true, requireTarget: 'smallGroup' },
    { id: 'exp_8', name: '기타/선교', subCategories: ['선교 후원', '기타 비품'], defaultWallet: '교부금', isWalletLocked: true }
  ]
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    loadFromStorage('cf_transactions', [])
  );
  
  const [members, setMembers] = useState<Member[]>(() => 
    loadFromStorage('cf_members', [])
  );

  const [categoryTree, setCategoryTree] = useState<CategoryTree>(() => 
    loadFromStorage('cf_category_tree', DEFAULT_CATEGORY_TREE)
  );

  const [wallets, setWallets] = useState<string[]>(() => 
    loadFromStorage('cf_wallets', ['교부금', '회비'])
  );

  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>(() => {
    const defaultData: BudgetConfig = { 
      year: new Date().getFullYear(), 
      totalBudget: 13350000,
      specialBudgets: [
        { id: 'pastor_visit', name: '목사님 심방비', quarterlyLimit: 0, yearlyLimit: 0 }
      ],
      organizations: [
        { 
          id: 'org_1', 
          name: '1목장', 
          type: 'NORMAL', 
          budgets: [
            { id: 'visit', categoryName: '심방비', halfYearlyLimit: 0, yearlyLimit: 150000 },
            { id: 'dinner', categoryName: '회식비', halfYearlyLimit: 75000, yearlyLimit: 150000 }
          ] 
        },
        {
          id: 'org_exec',
          name: '임원진',
          type: 'EXECUTIVE',
          budgets: [] // 상시 지출 (제한 없음)
        },
        {
          id: 'org_newcomer',
          name: '새가족팀',
          type: 'NEWCOMER',
          budgets: [
            { id: 'visit', categoryName: '다과/심방비', halfYearlyLimit: 0, yearlyLimit: 300000 },
            { id: 'operation', categoryName: '운영비', halfYearlyLimit: 0, yearlyLimit: 300000 }
          ]
        }
      ]
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stored = loadFromStorage<any>('cf_budget', null);
    if (!stored) return defaultData;
    
    // 기존 데이터 구조 업데이트 처리
    if (!stored.specialBudgets) {
      stored.specialBudgets = defaultData.specialBudgets;
    } else {
      stored.specialBudgets = stored.specialBudgets.filter((b: any) => b.id !== 'small_group');
    }
    
    // 마이그레이션: 과거 smallGroups가 존재한다면 organizations로 변환
    if (stored.smallGroups && !stored.organizations) {
      stored.organizations = stored.smallGroups.map((sg: any) => ({
        id: sg.id,
        name: sg.name,
        type: 'NORMAL',
        budgets: [
          { id: 'visit', categoryName: '심방비', halfYearlyLimit: 0, yearlyLimit: 150000 },
          { id: 'dinner', categoryName: '회식비', halfYearlyLimit: 75000, yearlyLimit: 150000 }
        ]
      }));
      delete stored.smallGroups; // 불필요한 과거 필드 삭제
    } else if (!stored.organizations) {
      stored.organizations = defaultData.organizations;
    }
    
    return stored as BudgetConfig;
  });

  // Sync to LocalStorage on change
  useEffect(() => {
    saveToStorage('cf_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage('cf_members', members);
  }, [members]);

  useEffect(() => {
    saveToStorage('cf_budget', budgetConfig);
  }, [budgetConfig]);

  useEffect(() => {
    saveToStorage('cf_category_tree', categoryTree);
  }, [categoryTree]);

  useEffect(() => {
    saveToStorage('cf_wallets', wallets);
  }, [wallets]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const updateTransaction = (id: string, updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
  };

  const updateTransactions = (updatedTransactions: Transaction[]) => {
    setTransactions(prev => {
      const newTransactions = [...prev];
      updatedTransactions.forEach(updated => {
        const index = newTransactions.findIndex(t => t.id === updated.id);
        if (index !== -1) {
          newTransactions[index] = updated;
        }
      });
      return newTransactions;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateBudgetConfig = (config: BudgetConfig) => {
    setBudgetConfig(config);
  };

  const addMember = (member: Member) => {
    setMembers(prev => [...prev, member]);
  };

  const updateMember = (id: string, updated: Member) => {
    setMembers(prev => prev.map(m => m.id === id ? updated : m));
  };

  const updateCategoryTree = (tree: CategoryTree) => {
    setCategoryTree(tree);
  };

  const addWallet = (name: string) => {
    if (!wallets.includes(name) && name.trim() !== '') {
      setWallets(prev => [...prev, name.trim()]);
    }
  };

  const renameWallet = (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (trimmedNew === '' || wallets.includes(trimmedNew)) return;
    
    setWallets(prev => prev.map(w => w === oldName ? trimmedNew : w));
    
    // 과거 전표 일괄 마이그레이션
    setTransactions(prev => prev.map(t => t.wallet === oldName ? { ...t, wallet: trimmedNew } : t));
    
    // 카테고리 기본 지갑 마이그레이션
    setCategoryTree(prev => {
      const newTree = { ...prev };
      newTree.INCOME = newTree.INCOME.map(c => c.defaultWallet === oldName ? { ...c, defaultWallet: trimmedNew } : c);
      newTree.EXPENSE = newTree.EXPENSE.map(c => c.defaultWallet === oldName ? { ...c, defaultWallet: trimmedNew } : c);
      return newTree;
    });
  };

  const deleteWallet = (name: string) => {
    // 삭제 시 기존 전표의 지갑 텍스트는 남아있음 (Soft delete 느낌)
    setWallets(prev => prev.filter(w => w !== name));
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      members,
      budgetConfig,
      categoryTree,
      addTransaction,
      addTransactions,
      updateTransaction,
      updateTransactions,
      deleteTransaction,
      updateBudgetConfig,
      addMember,
      updateMember,
      updateCategoryTree,
      wallets,
      addWallet,
      renameWallet,
      deleteWallet,
      updateWallets: setWallets
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
