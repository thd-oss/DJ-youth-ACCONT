import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { OrganizationGroup, OrgType, OrgBudgetLimit } from '../types';
import { Plus, Trash2 } from 'lucide-react';

export const SmallGroupEditor: React.FC = () => {
  const { budgetConfig, updateBudgetConfig, transactions, updateTransactions } = useFinance();
  
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<OrgType>('NORMAL');
  const [updateTransactionsOption, setUpdateTransactionsOption] = useState<boolean>(true);

  const handleAddOrg = () => {
    if (!newOrgName.trim()) return;
    
    let defaultBudgets: OrgBudgetLimit[] = [];
    if (newOrgType === 'NORMAL') {
      defaultBudgets = [
        { id: 'visit', categoryName: '목장 심방비', halfYearlyLimit: 0, yearlyLimit: 150000 },
        { id: 'dinner', categoryName: '목장 회식비', halfYearlyLimit: 75000, yearlyLimit: 150000 }
      ];
    } else if (newOrgType === 'NEWCOMER') {
      defaultBudgets = [
        { id: 'visit', categoryName: '다과/심방비', halfYearlyLimit: 0, yearlyLimit: 300000 },
        { id: 'operation', categoryName: '운영비', halfYearlyLimit: 0, yearlyLimit: 300000 }
      ];
    } else if (newOrgType === 'EXECUTIVE') {
      defaultBudgets = []; // 상시 지출 (무제한)
    }

    const newOrg: OrganizationGroup = {
      id: `org_${Date.now()}`,
      name: newOrgName.trim(),
      type: newOrgType,
      budgets: defaultBudgets
    };
    
    updateBudgetConfig({ 
      ...budgetConfig, 
      organizations: [...budgetConfig.organizations, newOrg] 
    });
    setNewOrgName('');
  };

  const handleDeleteOrg = (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까? (관련 지출 내역은 삭제되지 않지만 연결이 끊어집니다)')) return;
    const newOrgs = budgetConfig.organizations.filter(o => o.id !== id);
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });
  };

  const handleUpdateOrgName = (orgId: string, newName: string) => {
    const oldOrg = budgetConfig.organizations.find(o => o.id === orgId);
    if (!oldOrg) return;
    
    const newOrgs = budgetConfig.organizations.map(o => 
      o.id === orgId ? { ...o, name: newName } : o
    );
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });

    if (oldOrg.name !== newName && updateTransactionsOption) {
      const relatedTransactions = transactions.filter(t => t.targetId === orgId && t.description.includes(oldOrg.name));
      if (relatedTransactions.length > 0) {
        const updatedTransactions = relatedTransactions.map(t => ({
          ...t,
          description: t.description.replace(new RegExp(oldOrg.name, 'g'), newName)
        }));
        updateTransactions(updatedTransactions);
      }
    }
  };

  const handleUpdateBudget = (orgId: string, budgetId: string, field: 'halfYearlyLimit' | 'yearlyLimit', value: number) => {
    const newOrgs = budgetConfig.organizations.map(o => {
      if (o.id !== orgId) return o;
      return {
        ...o,
        budgets: o.budgets.map(b => b.id === budgetId ? { ...b, [field]: value } : b)
      };
    });
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });
  };

  const getTypeLabel = (type: OrgType) => {
    switch(type) {
      case 'NORMAL': return '일반 목장';
      case 'EXECUTIVE': return '임원진';
      case 'NEWCOMER': return '새가족팀';
      default: return '기타';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-4 px-2">
        <h2 className="text-base font-bold text-gray-800">목장 및 팀 관리</h2>
      </div>

      <div className="border border-ecount-border bg-gray-50 p-4 mb-6">
        <div className="flex items-center mb-4">
          <select 
            value={newOrgType}
            onChange={e => setNewOrgType(e.target.value as OrgType)}
            className="mr-2 h-8 text-xs px-2 border border-ecount-border focus:border-ecount-blue focus:outline-none bg-white"
          >
            <option value="NORMAL">일반 목장</option>
            <option value="EXECUTIVE">임원진</option>
            <option value="NEWCOMER">새가족팀</option>
          </select>
          <input 
            type="text" 
            value={newOrgName} 
            onChange={e => setNewOrgName(e.target.value)}
            placeholder="이름 (예: 1목장)"
            className="mr-2 h-8 text-xs px-2 border border-ecount-border focus:border-ecount-blue focus:outline-none w-48"
          />
          <button 
            onClick={handleAddOrg}
            className="flex items-center bg-white border border-ecount-border px-3 h-8 text-xs font-bold hover:bg-gray-100"
          >
            <Plus className="w-3 h-3 mr-1" /> 추가
          </button>
          <div className="ml-6 flex items-center text-xs text-gray-600">
            <input 
              type="checkbox" 
              id="updateTransactionsOpt" 
              checked={updateTransactionsOption} 
              onChange={(e) => setUpdateTransactionsOption(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="updateTransactionsOpt">
              목장명 수정 시 기존 지출 내역(적요)의 이름도 일괄 변경
            </label>
          </div>
        </div>
        
        <div className="overflow-x-auto border border-ecount-border">
          <table className="w-full text-xs bg-white text-left">
            <thead className="bg-gray-100 border-b border-ecount-border">
              <tr>
                <th className="px-3 py-2 w-32 border-r border-ecount-border">유형</th>
                <th className="px-3 py-2 w-48 border-r border-ecount-border">조직명</th>
                <th className="px-3 py-2">예산 항목 및 한도 설정</th>
                <th className="px-3 py-2 w-16 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {!budgetConfig.organizations || budgetConfig.organizations.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4 text-gray-500">등록된 조직이 없습니다.</td></tr>
              ) : (
                budgetConfig.organizations.map(org => (
                  <tr key={org.id} className="border-b border-ecount-border align-top">
                    <td className="px-3 py-2 border-r border-ecount-border text-gray-600">
                      {getTypeLabel(org.type)}
                    </td>
                    <td className="px-3 py-2 border-r border-ecount-border font-medium">
                      <input 
                        type="text" 
                        value={org.name} 
                        onChange={e => handleUpdateOrgName(org.id, e.target.value)}
                        className="w-full h-7 px-2 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:bg-yellow-50 transition-colors focus:outline-none" 
                      />
                    </td>
                    <td className="px-3 py-2">
                      {org.budgets.length === 0 ? (
                        <div className="text-gray-400 py-1">상시 지출 (한도 미적용)</div>
                      ) : (
                        <div className="grid gap-2">
                          {org.budgets.map(budget => (
                            <div key={budget.id} className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded border border-gray-100">
                              <span className="w-24 font-bold text-gray-700">{budget.categoryName}</span>
                              <div className="flex items-center">
                                <span className="text-gray-500 w-12">반기:</span>
                                <input 
                                  type="number" 
                                  value={budget.halfYearlyLimit || ''} 
                                  onChange={e => handleUpdateBudget(org.id, budget.id, 'halfYearlyLimit', parseInt(e.target.value||'0', 10))}
                                  className="w-24 text-right h-6 px-1 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:outline-none focus:bg-yellow-50 bg-white" placeholder="0"
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 w-12 pl-2">연간:</span>
                                <input 
                                  type="number" 
                                  value={budget.yearlyLimit || ''} 
                                  onChange={e => handleUpdateBudget(org.id, budget.id, 'yearlyLimit', parseInt(e.target.value||'0', 10))}
                                  className="w-24 text-right h-6 px-1 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:outline-none focus:bg-yellow-50 bg-white" placeholder="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <button onClick={() => handleDeleteOrg(org.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
