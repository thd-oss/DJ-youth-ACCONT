import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Copy, CheckCircle2 } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { currency: 'KRW' }).format(amount) + '원';
};

export const ReportGenerator: React.FC = () => {
  const { transactions, budgetConfig } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [copied, setCopied] = useState(false);

  const currentYear = budgetConfig.year;

  // 보고서 데이터 집계 로직
  const reportData = useMemo(() => {
    const targetPrefix = `${currentYear}-${selectedMonth.padStart(2, '0')}`;
    
    // 해당 월 거래내역 필터링
    const monthTx = transactions.filter(t => t.date.startsWith(targetPrefix));
    
    // 현재 총 잔액 계산 (전체 기간 누적)
    const grantBalance = transactions
      .filter(t => t.wallet === '교부금')
      .reduce((acc, t) => t.type === '수입' ? acc + t.amount : acc - t.amount, 0);
      
    const duesBalance = transactions
      .filter(t => t.wallet === '회비')
      .reduce((acc, t) => t.type === '수입' ? acc + t.amount : acc - t.amount, 0);

    // 해당 월 수입/지출 내역 분류
    const incomes = monthTx.filter(t => t.type === '수입');
    const expensesGrant = monthTx.filter(t => t.type === '지출' && t.wallet === '교부금');
    const expensesDues = monthTx.filter(t => t.type === '지출' && t.wallet === '회비');

    // 카테고리별 그룹화 헬퍼 함수
    const groupByCat = (txs: typeof transactions) => {
      const grouped: Record<string, number> = {};
      txs.forEach(t => {
        const label = `${t.category} (${t.subCategory})`;
        grouped[label] = (grouped[label] || 0) + t.amount;
      });
      return Object.entries(grouped).map(([label, amount]) => ({ label, amount }));
    };

    return {
      month: selectedMonth,
      grantBalance,
      duesBalance,
      totalIncome: incomes.reduce((acc, t) => acc + t.amount, 0),
      totalExpenseGrant: expensesGrant.reduce((acc, t) => acc + t.amount, 0),
      totalExpenseDues: expensesDues.reduce((acc, t) => acc + t.amount, 0),
      groupedIncomes: groupByCat(incomes),
      groupedExpGrant: groupByCat(expensesGrant),
      groupedExpDues: groupByCat(expensesDues),
    };
  }, [transactions, currentYear, selectedMonth]);

  const generateReportText = () => {
    const { 
      month, grantBalance, duesBalance, 
      totalIncome, totalExpenseGrant, totalExpenseDues,
      groupedIncomes, groupedExpGrant, groupedExpDues 
    } = reportData;

    let text = `📢 [${currentYear}년 ${month}월 청년부 재무 보고]\n\n`;
    
    text += `💰 [현재 자금 잔액]\n`;
    text += `- 교부금: ${formatCurrency(grantBalance)}\n`;
    text += `- 회비: ${formatCurrency(duesBalance)}\n`;
    text += `- 총계: ${formatCurrency(grantBalance + duesBalance)}\n\n`;

    text += `📥 [${month}월 주요 수입] (총 ${formatCurrency(totalIncome)})\n`;
    if (groupedIncomes.length === 0) text += `- 수입 내역 없음\n`;
    groupedIncomes.forEach(item => {
      text += `- ${item.label}: ${formatCurrency(item.amount)}\n`;
    });
    text += `\n`;

    text += `📤 [${month}월 교부금 지출] (총 ${formatCurrency(totalExpenseGrant)})\n`;
    if (groupedExpGrant.length === 0) text += `- 지출 내역 없음\n`;
    groupedExpGrant.forEach(item => {
      text += `- ${item.label}: ${formatCurrency(item.amount)}\n`;
    });
    text += `\n`;

    text += `📤 [${month}월 회비 지출] (총 ${formatCurrency(totalExpenseDues)})\n`;
    if (groupedExpDues.length === 0) text += `- 지출 내역 없음\n`;
    groupedExpDues.forEach(item => {
      text += `- ${item.label}: ${formatCurrency(item.amount)}\n`;
    });

    text += `\n감사합니다. 🙏`;
    return text;
  };

  const handleCopy = async () => {
    const text = generateReportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-gray-800">경영자 보고서</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className={`flex items-center border border-ecount-border px-3 h-7 text-xs font-bold transition-colors ${
              copied 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-white hover:bg-ecount-rowHover text-gray-700'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                복사 완료
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                카톡 공유 복사
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 border border-ecount-border bg-white">
        <div className="flex items-center gap-4 p-2 border-b border-ecount-border bg-gray-50">
          <label className="text-xs font-bold text-gray-700">보고 월 선택:</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-32 text-xs"
          >
            {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
              <option key={m} value={m}>{currentYear}년 {m}월</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 ml-auto mr-2">
            * 우측 상단의 '카톡 공유 복사' 버튼을 눌러 공지방에 바로 붙여넣기 하세요.
          </span>
        </div>

        <div className="flex-1 overflow-auto bg-white p-4">
          <div className="w-full max-w-2xl mx-auto border border-ecount-border bg-yellow-50 p-6 font-mono text-sm whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[400px]">
            {generateReportText()}
          </div>
        </div>
      </div>
    </div>
  );
};
