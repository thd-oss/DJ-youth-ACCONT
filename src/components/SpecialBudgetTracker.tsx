import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Settings, Save, Coffee, Users } from 'lucide-react';
import type { SpecialBudget, OrgBudgetLimit } from '../types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

export const SpecialBudgetTracker: React.FC = () => {
  const { budgetConfig, updateBudgetConfig, transactions } = useFinance();
  
  // 상태: 심방비(specialBudget) 설정 모드
  const [editingSpecial, setEditingSpecial] = useState<string | null>(null);
  const [tempQuarterly, setTempQuarterly] = useState('');
  const [tempYearly, setTempYearly] = useState('');

  // 상태: 목장/팀별 탭
  const [activeOrgId, setActiveOrgId] = useState<string>(
    budgetConfig.organizations?.length > 0 ? budgetConfig.organizations[0].id : ''
  );

  // 필터 규칙
  const getSpecialExpenses = (budgetId: string) => {
    return transactions.filter(t => t.type === '지출' && t.date.startsWith(budgetConfig.year.toString()) && 
      (t.targetId === budgetId || (t.category === '심방/목양' && t.subCategory === '목사님 심방비'))
    );
  };

  const getOrgBudgetExpenses = (orgId: string, categoryName: string) => {
    return transactions.filter(t => t.type === '지출' && t.date.startsWith(budgetConfig.year.toString()) && 
      t.targetId === orgId && (t.subCategory === categoryName || t.category === categoryName)
    );
  };

  const handleEditSpecial = (budget: SpecialBudget) => {
    setEditingSpecial(budget.id);
    setTempQuarterly(budget.quarterlyLimit.toString());
    setTempYearly(budget.yearlyLimit.toString());
  };

  const handleSaveSpecial = (budgetId: string) => {
    const qLimit = parseInt(tempQuarterly.replace(/[^0-9]/g, ''), 10) || 0;
    const yLimit = parseInt(tempYearly.replace(/[^0-9]/g, ''), 10) || 0;

    const newSpecialBudgets = budgetConfig.specialBudgets.map(b => 
      b.id === budgetId ? { ...b, quarterlyLimit: qLimit, yearlyLimit: yLimit } : b
    );
    updateBudgetConfig({ ...budgetConfig, specialBudgets: newSpecialBudgets });
    setEditingSpecial(null);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentHalfYear = currentMonth <= 6 ? 1 : 2;

  // 특별 예산(목사님 심방비)는 분기별이었으나 동일하게 렌더링 (단, 분기별 텍스트 유지)
  const currentQuarter = Math.ceil(currentMonth / 3);

  const renderSpecialCard = (
    title: string, 
    icon: React.ReactNode, 
    limitConfig: { quarterlyLimit: number, yearlyLimit: number },
    expenses: any[],
    isEditing: boolean,
    onEditStart?: () => void,
    onEditSave?: () => void,
    tempQ?: string, setTempQ?: (v: string) => void,
    tempY?: string, setTempY?: (v: string) => void
  ) => {
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingYearly = limitConfig.yearlyLimit - totalSpent;
    
    const quarterlySpent = expenses.filter(t => {
      const txMonth = parseInt(t.date.split('-')[1], 10);
      return Math.ceil(txMonth / 3) === currentQuarter;
    }).reduce((acc, curr) => acc + curr.amount, 0);
    const remainingQuarterly = limitConfig.quarterlyLimit - quarterlySpent;

    return (
      <div className="border border-ecount-border bg-white flex flex-col mb-6">
        <div className="bg-gray-50 border-b border-ecount-border p-3 flex items-center justify-between">
          <div className="flex items-center text-ecount-navy font-bold text-sm">
            {icon}
            {title}
          </div>
          {isEditing ? (
            <button 
              onClick={onEditSave}
              className="flex items-center border border-ecount-border bg-gray-100 hover:bg-gray-200 px-2 h-7 text-xs font-bold"
            >
              <Save className="w-3 h-3 mr-1" /> 저장
            </button>
          ) : (
            onEditStart && (
              <button 
                onClick={onEditStart}
                className="flex items-center border border-ecount-border bg-white hover:bg-ecount-rowHover px-2 h-7 text-xs"
              >
                <Settings className="w-3 h-3 mr-1" /> 한도 설정
              </button>
            )
          )}
        </div>
        
        <div className="p-4">
          {isEditing && tempQ !== undefined && setTempQ && tempY !== undefined && setTempY ? (
            <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-100 pb-4">
              <div>
                <label className="block text-[11px] text-gray-500 font-bold mb-1">분기별 한도액</label>
                <input 
                  type="number" 
                  value={tempQ} onChange={e => setTempQ(e.target.value)}
                  className="w-full text-right" placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 font-bold mb-1">연간 총 한도액</label>
                <input 
                  type="number" 
                  value={tempY} onChange={e => setTempY(e.target.value)}
                  className="w-full text-right" placeholder="0"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-100 pb-4">
              <div>
                <div className="text-[11px] text-gray-500 font-bold mb-1">{currentQuarter}분기 한도 현황</div>
                <div className="text-xs flex justify-between mb-1">
                  <span>사용액:</span><span className="font-bold">{formatCurrency(quarterlySpent)}</span>
                </div>
                <div className="text-xs flex justify-between">
                  <span>잔액:</span>
                  <span className={`font-bold ${remainingQuarterly < 0 ? 'text-red-500' : 'text-ecount-blue'}`}>
                    {limitConfig.quarterlyLimit === 0 ? '미적용' : formatCurrency(remainingQuarterly)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 font-bold mb-1">연간 한도 현황</div>
                <div className="text-xs flex justify-between mb-1">
                  <span>총 사용액:</span><span className="font-bold">{formatCurrency(totalSpent)}</span>
                </div>
                <div className="text-xs flex justify-between">
                  <span>총 잔액:</span>
                  <span className={`font-bold ${remainingYearly < 0 ? 'text-red-500' : 'text-ecount-blue'}`}>
                    {limitConfig.yearlyLimit === 0 ? '미적용' : formatCurrency(remainingYearly)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-[11px] font-bold text-gray-700 mb-2">지출 상세 내역</div>
          <div className="border border-ecount-border max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-200 shadow-sm">
                <tr>
                  <th className="px-2 py-1.5 text-left w-24">날짜</th>
                  <th className="px-2 py-1.5 text-left">적요</th>
                  <th className="px-2 py-1.5 text-right w-24">금액</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-4">사용 내역이 없습니다.</td></tr>
                ) : (
                  expenses.map(tx => (
                    <tr key={tx.id} className="hover:bg-ecount-rowHover border-b border-ecount-border last:border-0">
                      <td className="px-2 py-1.5 text-gray-600">{tx.date}</td>
                      <td className="px-2 py-1.5">{tx.description}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-red-600">{formatCurrency(tx.amount)}</td>
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

  const renderOrgBudgetCard = (
    title: string, 
    icon: React.ReactNode, 
    budgetLimit: OrgBudgetLimit,
    expenses: any[]
  ) => {
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingYearly = budgetLimit.yearlyLimit - totalSpent;
    
    const halfYearlySpent = expenses.filter(t => {
      const txMonth = parseInt(t.date.split('-')[1], 10);
      return (txMonth <= 6 ? 1 : 2) === currentHalfYear;
    }).reduce((acc, curr) => acc + curr.amount, 0);
    const remainingHalfYearly = budgetLimit.halfYearlyLimit - halfYearlySpent;

    return (
      <div className="border border-ecount-border bg-white flex flex-col mb-6">
        <div className="bg-gray-50 border-b border-ecount-border p-3 flex items-center justify-between">
          <div className="flex items-center text-ecount-navy font-bold text-sm">
            {icon}
            {title}
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-100 pb-4">
            <div>
              <div className="text-[11px] text-gray-500 font-bold mb-1">{currentHalfYear === 1 ? '상반기' : '하반기'} 한도 현황</div>
              <div className="text-xs flex justify-between mb-1">
                <span>사용액:</span><span className="font-bold">{formatCurrency(halfYearlySpent)}</span>
              </div>
              <div className="text-xs flex justify-between">
                <span>잔액:</span>
                <span className={`font-bold ${remainingHalfYearly < 0 ? 'text-red-500' : 'text-ecount-blue'}`}>
                  {budgetLimit.halfYearlyLimit === 0 ? '미적용' : formatCurrency(remainingHalfYearly)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 font-bold mb-1">연간 한도 현황</div>
              <div className="text-xs flex justify-between mb-1">
                <span>총 사용액:</span><span className="font-bold">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="text-xs flex justify-between">
                <span>총 잔액:</span>
                <span className={`font-bold ${remainingYearly < 0 ? 'text-red-500' : 'text-ecount-blue'}`}>
                  {budgetLimit.yearlyLimit === 0 ? '미적용' : formatCurrency(remainingYearly)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-[11px] font-bold text-gray-700 mb-2">지출 상세 내역</div>
          <div className="border border-ecount-border max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-200 shadow-sm">
                <tr>
                  <th className="px-2 py-1.5 text-left w-24">날짜</th>
                  <th className="px-2 py-1.5 text-left">적요</th>
                  <th className="px-2 py-1.5 text-right w-24">금액</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-4">사용 내역이 없습니다.</td></tr>
                ) : (
                  expenses.map(tx => (
                    <tr key={tx.id} className="hover:bg-ecount-rowHover border-b border-ecount-border last:border-0">
                      <td className="px-2 py-1.5 text-gray-600">{tx.date}</td>
                      <td className="px-2 py-1.5">{tx.description}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-red-600">{formatCurrency(tx.amount)}</td>
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

  const activeOrg = budgetConfig.organizations?.find(o => o.id === activeOrgId);

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5 overflow-y-auto">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
        <h2 className="text-base font-bold text-gray-800">심방/회식비 사용 현황</h2>
      </div>

      {/* 1. 특별 예산 현황 (목사님 심방비 등) */}
      <div className="mb-2 text-sm font-bold text-gray-700 px-1">기본 심방비 현황</div>
      <div className="grid gap-6 md:grid-cols-2">
        {budgetConfig.specialBudgets.map(budget => (
          <React.Fragment key={budget.id}>
            {renderSpecialCard(
              budget.name, 
              <Coffee className="w-4 h-4 mr-2" />, 
              budget, 
              getSpecialExpenses(budget.id),
              editingSpecial === budget.id,
              () => handleEditSpecial(budget),
              () => handleSaveSpecial(budget.id),
              tempQuarterly, setTempQuarterly,
              tempYearly, setTempYearly
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 2. 목장별/조직별 회식비 현황 */}
      <div className="mt-4 mb-2 flex items-center justify-between px-1">
        <div className="text-sm font-bold text-gray-700">목장 및 팀별 예산 현황</div>
      </div>

      <>
        {!budgetConfig.organizations || budgetConfig.organizations.length === 0 ? (
          <div className="border border-ecount-border p-8 text-center text-gray-500 text-sm bg-white">
            등록된 조직이 없습니다. 좌측 메뉴 '기본 세팅 &gt; 목장 관리'에서 추가해주세요.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="border border-ecount-border bg-white">
                <div className="bg-gray-50 border-b border-ecount-border p-2 px-3 text-xs font-bold text-gray-600">
                  조직 리스트
                </div>
                <ul className="max-h-[500px] overflow-y-auto">
                  {budgetConfig.organizations.map(org => (
                    <li key={org.id}>
                      <button
                        onClick={() => setActiveOrgId(org.id)}
                        className={`w-full text-left px-4 py-3 text-xs border-b border-gray-100 hover:bg-gray-50 ${activeOrgId === org.id ? 'bg-ecount-blue text-white font-bold hover:bg-blue-600' : 'text-gray-700'}`}
                      >
                        <Users className="w-3 h-3 inline mr-2 opacity-70" />
                        {org.name}
                        {org.type !== '일반 목장' && (
                          <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">{org.type}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              {activeOrg && (
                activeOrg.budgets.length === 0 ? (
                  <div className="border border-ecount-border bg-white p-8 text-center text-gray-500 text-sm">
                    {activeOrg.name}은(는) 상시 지출 부서이므로 한도 추적 대상이 아닙니다.
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4">
                    {activeOrg.budgets.map(budgetLimit => (
                      <React.Fragment key={budgetLimit.id}>
                        {renderOrgBudgetCard(
                          `${activeOrg.name} ${budgetLimit.categoryName}`,
                          <Users className="w-4 h-4 mr-2" />,
                          budgetLimit,
                          getOrgBudgetExpenses(activeOrg.id, budgetLimit.categoryName)
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </>
    </div>
  );
};
