import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { OrganizationGroup, OrgBudgetLimit } from '../types';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export const SmallGroupEditor: React.FC = () => {
  const { budgetConfig, updateBudgetConfig, transactions, updateTransactions, orgTypes, addOrgType, renameOrgType, deleteOrgType } = useFinance();
  
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<string>('');
  const [updateTransactionsOption, setUpdateTransactionsOption] = useState<boolean>(true);

  // OrgType Manager State
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<{old: string, new: string} | null>(null);

  useEffect(() => {
    if (orgTypes.length > 0 && !orgTypes.includes(newOrgType)) {
      setNewOrgType(orgTypes[0]);
    }
  }, [orgTypes, newOrgType]);

  const handleAddType = () => {
    if (newTypeName.trim()) {
      addOrgType(newTypeName.trim());
      setNewTypeName('');
    }
  };

  const handleSaveTypeEdit = () => {
    if (editingType && editingType.new.trim()) {
      renameOrgType(editingType.old, editingType.new.trim());
      setEditingType(null);
    }
  };

  const handleDeleteType = (name: string) => {
    if (budgetConfig.organizations.some(o => o.type === name)) {
      alert('이 유형을 사용 중인 조직이 있습니다. 조직을 먼저 삭제하거나 유형을 변경해 주세요.');
      return;
    }
    if (window.confirm(`'${name}' 유형을 삭제하시겠습니까?`)) {
      deleteOrgType(name);
    }
  };

  const handleAddOrg = () => {
    if (!newOrgName.trim() || !newOrgType) return;
    
    const newOrg: OrganizationGroup = {
      id: `org_${Date.now()}`,
      name: newOrgName.trim(),
      type: newOrgType,
      budgets: [] // 비어있는 채로 생성
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

  const handleUpdateOrgType = (orgId: string, newType: string) => {
    const newOrgs = budgetConfig.organizations.map(o => 
      o.id === orgId ? { ...o, type: newType } : o
    );
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });
  };

  const handleAddBudget = (orgId: string) => {
    const name = window.prompt('새 예산 항목 이름을 입력하세요 (예: 간식비, 운영비)');
    if (!name || !name.trim()) return;

    const newOrgs = budgetConfig.organizations.map(o => {
      if (o.id !== orgId) return o;
      const newBudget: OrgBudgetLimit = {
        id: `bud_${Date.now()}`,
        categoryName: name.trim(),
        halfYearlyLimit: 0,
        yearlyLimit: 0
      };
      return { ...o, budgets: [...o.budgets, newBudget] };
    });
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });
  };

  const handleUpdateBudget = (orgId: string, budgetId: string, field: 'halfYearlyLimit' | 'yearlyLimit' | 'categoryName', value: any) => {
    const newOrgs = budgetConfig.organizations.map(o => {
      if (o.id !== orgId) return o;
      return {
        ...o,
        budgets: o.budgets.map(b => b.id === budgetId ? { ...b, [field]: value } : b)
      };
    });
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });
  };

  const handleDeleteBudget = (orgId: string, budgetId: string) => {
    if (!window.confirm('이 예산 항목을 삭제하시겠습니까?')) return;
    const newOrgs = budgetConfig.organizations.map(o => {
      if (o.id !== orgId) return o;
      return { ...o, budgets: o.budgets.filter(b => b.id !== budgetId) };
    });
    updateBudgetConfig({ ...budgetConfig, organizations: newOrgs });
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-4 px-2">
        <h2 className="text-base font-bold text-gray-800">목장 및 팀 관리</h2>
      </div>

      <div className="mb-6 border border-ecount-border">
        <div className="bg-gray-100 px-3 py-2 border-b border-ecount-border font-bold text-xs text-gray-700">조직 유형 (분류) 관리</div>
        <div className="p-3 bg-white flex flex-wrap gap-2">
          {orgTypes.map(type => (
            <div key={type} className="flex items-center bg-gray-50 border border-ecount-border rounded px-2 py-1 text-xs">
              {editingType?.old === type ? (
                <>
                  <input 
                    type="text" 
                    value={editingType.new} 
                    onChange={e => setEditingType({...editingType, new: e.target.value})}
                    className="w-24 h-6 px-1 border border-ecount-blue focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveTypeEdit} className="ml-1 text-green-600"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setEditingType(null)} className="ml-1 text-gray-400"><X className="w-3 h-3" /></button>
                </>
              ) : (
                <>
                  <span className="font-medium mr-2">{type}</span>
                  <button onClick={() => setEditingType({old: type, new: type})} className="text-gray-400 hover:text-ecount-blue"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteType(type)} className="ml-1 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </>
              )}
            </div>
          ))}
          <div className="flex items-center">
            <input 
              type="text" 
              value={newTypeName} 
              onChange={e => setNewTypeName(e.target.value)}
              placeholder="새 유형 이름"
              className="h-7 text-xs px-2 border border-ecount-border focus:border-ecount-blue focus:outline-none w-28"
            />
            <button 
              onClick={handleAddType}
              className="ml-1 bg-white border border-ecount-border px-2 h-7 text-xs hover:bg-gray-50 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" /> 추가
            </button>
          </div>
        </div>
      </div>

      <div className="border border-ecount-border bg-gray-50 p-4 mb-6">
        <div className="flex items-center mb-4">
          <select 
            value={newOrgType}
            onChange={e => setNewOrgType(e.target.value)}
            className="mr-2 h-8 text-xs px-2 border border-ecount-border focus:border-ecount-blue focus:outline-none bg-white min-w-[100px]"
          >
            {orgTypes.map(t => <option key={t} value={t}>{t}</option>)}
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
            <Plus className="w-3 h-3 mr-1" /> 조직 추가
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
              조직명 수정 시 기존 지출 내역(적요)의 이름도 일괄 변경
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
                      <select 
                        value={org.type}
                        onChange={e => handleUpdateOrgType(org.id, e.target.value)}
                        className="w-full h-7 px-1 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:bg-yellow-50 focus:outline-none bg-transparent"
                      >
                        {orgTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        {!orgTypes.includes(org.type) && <option value={org.type}>{org.type}</option>}
                      </select>
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
                      <div className="grid gap-2">
                        {org.budgets.map(budget => (
                          <div key={budget.id} className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded border border-gray-100">
                            <input 
                              type="text"
                              value={budget.categoryName}
                              onChange={e => handleUpdateBudget(org.id, budget.id, 'categoryName', e.target.value)}
                              className="w-24 font-bold text-gray-700 bg-transparent border-b border-dashed border-gray-300 focus:border-ecount-blue focus:outline-none px-1 h-6"
                            />
                            <div className="flex items-center">
                              <span className="text-gray-500 w-12 text-right pr-1">반기:</span>
                              <input 
                                type="number" 
                                value={budget.halfYearlyLimit || ''} 
                                onChange={e => handleUpdateBudget(org.id, budget.id, 'halfYearlyLimit', parseInt(e.target.value||'0', 10))}
                                className="w-24 text-right h-6 px-1 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:outline-none focus:bg-yellow-50 bg-white" placeholder="0"
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 w-12 text-right pr-1">연간:</span>
                              <input 
                                type="number" 
                                value={budget.yearlyLimit || ''} 
                                onChange={e => handleUpdateBudget(org.id, budget.id, 'yearlyLimit', parseInt(e.target.value||'0', 10))}
                                className="w-24 text-right h-6 px-1 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:outline-none focus:bg-yellow-50 bg-white" placeholder="0"
                              />
                            </div>
                            <button onClick={() => handleDeleteBudget(org.id, budget.id)} className="text-gray-400 hover:text-red-500 ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddBudget(org.id)}
                          className="flex items-center text-ecount-blue hover:text-blue-700 mt-1 w-max px-1"
                        >
                          <Plus className="w-3 h-3 mr-1" /> 예산 항목 추가
                        </button>
                      </div>
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
