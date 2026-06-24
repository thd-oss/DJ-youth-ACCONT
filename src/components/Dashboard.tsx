import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, Settings, Save } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

export const Dashboard: React.FC = () => {
  const { transactions, budgetConfig, updateBudgetConfig } = useFinance();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetConfig.totalBudget.toString());

  const calculateBalance = (walletType: '교부금' | '회비') => {
    return transactions
      .filter(t => t.wallet === walletType)
      .reduce((acc, curr) => {
        return curr.type === '수입' ? acc + curr.amount : acc - curr.amount;
      }, 0);
  };

  const grantBalance = calculateBalance('교부금');
  const duesBalance = calculateBalance('회비');

  const totalExpense = transactions
    .filter(t => t.type === '지출' && t.date.startsWith(budgetConfig.year.toString()))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const budgetUsagePercent = budgetConfig.totalBudget > 0 
    ? Math.min((totalExpense / budgetConfig.totalBudget) * 100, 100)
    : 0;

  const handleSaveBudget = () => {
    const numValue = parseInt(tempBudget.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numValue)) {
      updateBudgetConfig({ ...budgetConfig, totalBudget: numValue });
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-gray-800">대시보드 (재무 요약)</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* 교부금 카드 */}
        <div className="border border-ecount-border p-4 flex flex-col justify-between bg-white relative">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Wallet className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3 relative z-10">
            <h3 className="text-xs font-bold text-ecount-navy">교부금 잔액</h3>
            <span className="text-[10px] text-gray-400">교회 지원금 전용</span>
          </div>
          <div className="relative z-10 text-right">
            <div className="text-xl font-bold text-gray-800">{formatCurrency(grantBalance)}</div>
          </div>
        </div>

        {/* 회비 카드 */}
        <div className="border border-ecount-border p-4 flex flex-col justify-between bg-white relative">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Wallet className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3 relative z-10">
            <h3 className="text-xs font-bold text-ecount-navy">청년부 회비 잔액</h3>
            <span className="text-[10px] text-gray-400">자체 조달 자금</span>
          </div>
          <div className="relative z-10 text-right">
            <div className="text-xl font-bold text-gray-800">{formatCurrency(duesBalance)}</div>
          </div>
        </div>
      </div>

      {/* 예산 진행 상황 */}
      <div className="border border-ecount-border p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div className="flex items-center">
            <h3 className="text-xs font-bold text-ecount-navy">{budgetConfig.year}년 예산 대비 지출 현황</h3>
          </div>
          <div className="flex items-center mt-3 sm:mt-0">
            {isEditingBudget ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-32 text-right"
                  placeholder="예산 금액"
                />
                <button 
                  onClick={handleSaveBudget}
                  className="flex items-center border border-ecount-border bg-gray-100 hover:bg-gray-200 px-3 h-8 text-xs font-bold"
                >
                  <Save className="w-4 h-4 mr-1" />
                  저장
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setTempBudget(budgetConfig.totalBudget.toString());
                  setIsEditingBudget(true);
                }}
                className="flex items-center border border-ecount-border bg-white hover:bg-ecount-rowHover px-3 h-8 text-xs font-bold text-gray-700"
              >
                <Settings className="w-4 h-4 mr-1" />
                예산 설정
              </button>
            )}
          </div>
        </div>
        
        <table className="w-full mb-4 text-right">
          <tbody>
            <tr>
              <th className="bg-gray-50 text-left w-32 px-3 py-2">총 예산</th>
              <td className="font-bold text-ecount-blue px-3 py-2">{formatCurrency(budgetConfig.totalBudget)}</td>
            </tr>
            <tr>
              <th className="bg-gray-50 text-left w-32 px-3 py-2">누적 지출</th>
              <td className="font-bold text-red-600 px-3 py-2">{formatCurrency(totalExpense)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="relative w-full h-3.5 border border-ecount-border bg-gray-50 overflow-hidden mt-2">
          <div 
            className={`h-full transition-all duration-500 ${
              budgetUsagePercent > 90 ? 'bg-red-500' : 
              budgetUsagePercent > 70 ? 'bg-orange-400' : 'bg-ecount-blue'
            }`}
            style={{ width: `${budgetUsagePercent}%` }}
          />
        </div>
        <div className="mt-2 text-right text-[11px] text-gray-500 font-bold">
          소진율: {budgetUsagePercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
