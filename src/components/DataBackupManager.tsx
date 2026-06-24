import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, PlusCircle, Download, Save, RefreshCw, FileDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType, WalletType } from '../types';

// 임시 데이터 인터페이스 (가공 대기열)
interface PreviewRow {
  id: string; // 임시 ID
  rawDate: string;
  rawType: string;
  rawAmount: string;
  rawDescription: string;
  
  // 파싱 후 매핑할 데이터
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  
  // 사용자 선택 필드
  category: string;
  subCategory: string;
  wallet: WalletType;
  isWalletLocked: boolean;
  
  // 상태
  isDuplicate: boolean;
  selected: boolean;
}

export const DataBackupManager: React.FC = () => {
  const { transactions, addTransactions, categoryTree, budgetConfig, wallets, updateTransactions, updateCategoryTree, updateBudgetConfig, updateWallets } = useFinance();
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Helper: 날짜 문자열 정제 (YYYY-MM-DD 포맷팅 추정)
  const parseDateString = (dateStr: string): string => {
    const cleanStr = dateStr.split(' ')[0].replace(/\./g, '-').replace(/\//g, '-');
    const parts = cleanStr.split('-');
    
    if (parts.length === 3) {
      let [y, m, d] = parts;
      if (y.length === 2) y = `20${y}`;
      if (m.length === 1) m = `0${m}`;
      if (d.length === 1) d = `0${d}`;
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const processRows = (rows: Record<string, any>[]) => {
      if (rows.length === 0) {
        setIsProcessing(false);
        return;
      }

      // 헤더 동적 추론 로직 (은행 포맷 대응)
      const headers = Object.keys(rows[0]);
      const dateKey = headers.find(h => h.includes('일시') || h.includes('날짜') || h.includes('일자')) || headers[0];
      const typeKey = headers.find(h => h.includes('구분') || h.includes('종류')) || headers[1];
      const amountKey = headers.find(h => h.includes('금액') || h.includes('출금') || h.includes('입금')) || headers[2];
      const descKey = headers.find(h => h.includes('내용') || h.includes('적요') || h.includes('거래처')) || headers[3];

      const processed: PreviewRow[] = rows.map((row, index) => {
        const rawDate = String(row[dateKey] || '');
        const rawType = String(row[typeKey] || '');
        const rawAmount = String(row[amountKey] || '0');
        const rawDescription = String(row[descKey] || '');

        const date = parseDateString(rawDate);
        const type: TransactionType = rawType.includes('출') || rawType.includes('지출') ? '지출' : '수입';
        const amount = parseInt(rawAmount.replace(/[^0-9-]/g, ''), 10) || 0;
        const description = rawDescription;

        // 중복 검사 로직
        const isDuplicate = transactions.some(
          t => t.date === date && t.amount === amount && t.description === description
        );

        // 초기 분류 설정
        const currentNodes = type === '수입' ? categoryTree.INCOME : categoryTree.EXPENSE;
        const defaultNode = currentNodes[0];
        
        const initialCategory = defaultNode ? defaultNode.name : '';
        const initialSubCategory = defaultNode && defaultNode.subCategories.length > 0 ? defaultNode.subCategories[0] : '';
        const defaultWallet = defaultNode ? defaultNode.defaultWallet : (wallets[0] || '');
        const isWalletLocked = defaultNode ? defaultNode.isWalletLocked : false;

        return {
          id: `temp-${index}`,
          rawDate, rawType, rawAmount, rawDescription,
          date, type, amount, description,
          category: initialCategory,
          subCategory: initialSubCategory,
          wallet: defaultWallet,
          isWalletLocked,
          isDuplicate,
          selected: !isDuplicate
        };
      });

      setPreviewData(processed);
      setIsProcessing(false);
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRows(results.data as Record<string, any>[]);
        },
        error: () => {
          alert('CSV 파싱 중 오류가 발생했습니다.');
          setIsProcessing(false);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          processRows(json as Record<string, any>[]);
        } catch (error) {
          alert('엑셀 파일 파싱 중 오류가 발생했습니다.');
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        alert('파일을 읽는 중 오류가 발생했습니다.');
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('지원하지 않는 파일 형식입니다. CSV 또는 엑셀 파일을 업로드해주세요.');
      setIsProcessing(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRowCategoryChange = (id: string, newCategory: string) => {
    setPreviewData(prev => prev.map(row => {
      if (row.id !== id) return row;
      
      const currentNodes = row.type === '수입' ? categoryTree.INCOME : categoryTree.EXPENSE;
      const foundNode = currentNodes.find(c => c.name === newCategory);
      
      if (!foundNode) return row;

      return {
        ...row,
        category: newCategory,
        subCategory: foundNode.subCategories[0] || '',
        wallet: foundNode.defaultWallet,
        isWalletLocked: foundNode.isWalletLocked
      };
    }));
  };

  const handleRowSubCategoryChange = (id: string, newSubCategory: string) => {
    setPreviewData(prev => prev.map(row => row.id === id ? { ...row, subCategory: newSubCategory } : row));
  };

  const handleRowWalletChange = (id: string, newWallet: WalletType) => {
    setPreviewData(prev => prev.map(row => row.id === id ? { ...row, wallet: newWallet } : row));
  };

  const toggleRowSelection = (id: string) => {
    setPreviewData(prev => prev.map(row => row.id === id ? { ...row, selected: !row.selected } : row));
  };

  const handleMerge = () => {
    const selectedRows = previewData.filter(r => r.selected);
    if (selectedRows.length === 0) return;

    const newTransactions: Transaction[] = selectedRows.map(row => {
      // Add logic to attach targetId if required by the category node
      const currentNodes = row.type === '수입' ? categoryTree.INCOME : categoryTree.EXPENSE;
      const foundNode = currentNodes.find(c => c.name === row.category);
      
      let targetId;
      if (foundNode?.requireTarget === 'pastor') {
        targetId = 'pastor_visit';
      }
      
      return {
        id: crypto.randomUUID(),
        date: row.date,
        type: row.type,
        wallet: row.wallet,
        category: row.category,
        subCategory: row.subCategory,
        amount: row.amount,
        description: row.description,
        targetId
      };
    });

    addTransactions(newTransactions);
    setPreviewData(prev => prev.filter(r => !r.selected));
    alert(`${selectedRows.length}건이 장부에 등록되었습니다.`);
  };

  // 백업 기능 (JSON Export)
  const handleBackup = () => {
    const backupData = {
      transactions,
      categoryTree,
      budgetConfig,
      wallets,
      backupDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `church_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 복구 기능 (JSON Import)
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('경고: 현재 PC에 저장된 모든 데이터가 삭제되고 업로드한 백업 파일의 데이터로 덮어쓰기 됩니다. 계속하시겠습니까?')) {
      if (restoreInputRef.current) restoreInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonStr = e.target?.result as string;
        const backupData = JSON.parse(jsonStr);
        
        if (backupData.transactions && backupData.categoryTree && backupData.budgetConfig) {
          updateTransactions(backupData.transactions);
          updateCategoryTree(backupData.categoryTree);
          updateBudgetConfig(backupData.budgetConfig);
          if (backupData.wallets) {
            updateWallets(backupData.wallets);
          }
          alert('데이터 복구가 완료되었습니다.');
        } else {
          throw new Error('Invalid backup file format');
        }
      } catch (err) {
        alert('올바른 백업 파일이 아닙니다.');
      }
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // 장부 CSV 내보내기
  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const csvData = transactions.map(t => ({
      '날짜': t.date,
      '구분': t.type,
      '대분류': t.category,
      '소분류': t.subCategory,
      '지갑': t.wallet,
      '금액': t.amount,
      '적요': t.description,
      '조직명': budgetConfig.organizations?.find(o => o.id === t.targetId)?.name || (t.targetId === 'pastor_visit' ? '목사님' : '')
    }));

    const csvStr = Papa.unparse(csvData);
    // Add BOM for Excel UTF-8 display
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
        <h2 className="text-base font-bold text-gray-800">데이터 백업 및 엑셀 관리</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 시스템 백업/복구 영역 */}
        <div className="border border-ecount-border flex flex-col bg-white shadow-sm">
          <div className="bg-gray-100 border-b border-ecount-border px-4 py-2 font-bold text-gray-800 text-sm flex items-center">
            <Save className="w-4 h-4 mr-2 text-ecount-navy" />
            전체 시스템 백업 / 복구
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              현재 저장된 모든 회계 장부와 조직/예산/지갑 설정 전체를 하나의 파일로 다운로드하거나, 다른 PC에서 복구할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleBackup}
                className="flex-1 flex items-center justify-center border border-ecount-border bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" /> 백업 (JSON 다운로드)
              </button>
              <label className="flex-1 flex items-center justify-center border border-ecount-blue bg-blue-50 hover:bg-blue-100 px-4 py-2.5 text-xs font-bold text-ecount-navy shadow-sm cursor-pointer transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" /> 복구 (데이터 덮어쓰기)
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  ref={restoreInputRef}
                  onChange={handleRestore}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 엑셀 내보내기 영역 */}
        <div className="border border-ecount-border flex flex-col bg-white shadow-sm">
          <div className="bg-gray-100 border-b border-ecount-border px-4 py-2 font-bold text-gray-800 text-sm flex items-center">
            <FileDown className="w-4 h-4 mr-2 text-emerald-600" />
            장부 엑셀(CSV) 내보내기
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              현재까지 기록된 모든 전표(수입/지출 내역)를 엑셀에서 열어볼 수 있는 CSV 포맷으로 다운로드합니다.
            </p>
            <button 
              onClick={handleExportCsv}
              className="w-full flex items-center justify-center border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition-colors"
            >
              <FileDown className="w-4 h-4 mr-2" /> 전표 전체 CSV 다운로드
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-ecount-border pt-6 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
          <Upload className="w-4 h-4 mr-2" />
          은행 입출금내역 가져오기
        </h3>
        
        <div className="border border-ecount-border p-6 flex flex-col items-center justify-center bg-gray-50 shadow-sm mb-4">
          <p className="text-xs text-gray-500 mb-4 text-center max-w-md leading-relaxed">
            은행에서 다운로드한 엑셀(CSV/XLSX) 거래내역을 업로드하여 장부에 일괄 등록합니다.<br/>
            기존 장부와 중복되는 항목은 자동으로 제외됩니다.
          </p>
          <label className="cursor-pointer border border-ecount-border bg-white hover:bg-ecount-rowHover px-6 py-2 text-xs font-bold text-gray-700 shadow-sm">
            <span>{isProcessing ? '처리 중...' : '파일 선택 (CSV/XLSX)'}</span>
            <input  
              type="file" 
              accept=".csv, .xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>
        </div>
      </div>

      {previewData.length > 0 && (
        <div className="flex flex-col border border-ecount-border bg-white overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="flex items-center justify-between p-2 border-b border-ecount-border bg-gray-100">
            <h3 className="text-xs font-bold text-gray-800">
              가공 대기열 ({previewData.length}건)
            </h3>
            <button
              onClick={handleMerge}
              className="flex items-center border border-ecount-border bg-white hover:bg-ecount-rowHover px-2 h-6 text-xs font-bold text-ecount-navy"
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              선택 등록
            </button>
          </div>
          
          <div className="overflow-auto flex-1 max-h-[500px]">
            <table className="w-full text-center">
              <thead className="sticky top-0 bg-gray-200 z-10 border-b border-ecount-border">
                <tr>
                  <th className="w-8 py-2 border-r border-ecount-border">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setPreviewData(prev => prev.map(r => (!r.isDuplicate ? { ...r, selected: isChecked } : r)));
                      }}
                      checked={previewData.length > 0 && previewData.every(r => r.isDuplicate || r.selected)}
                    />
                  </th>
                  <th className="w-24 border-r border-ecount-border">날짜</th>
                  <th className="border-r border-ecount-border">적요 (내용)</th>
                  <th className="w-24 border-r border-ecount-border">금액</th>
                  <th className="w-16 border-r border-ecount-border">구분</th>
                  <th className="w-28 border-r border-ecount-border">대분류</th>
                  <th className="w-28 border-r border-ecount-border">소분류</th>
                  <th className="w-24">지갑</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {previewData.map((row) => {
                  const currentNodes = row.type === '수입' ? categoryTree.INCOME : categoryTree.EXPENSE;
                  
                  return (
                    <tr key={row.id} className={`${row.isDuplicate ? 'bg-red-50 text-gray-400' : 'hover:bg-yellow-50/50'} border-b border-ecount-border`}>
                      <td className="border-r border-ecount-border py-1">
                        <input 
                          type="checkbox" 
                          checked={row.selected}
                          onChange={() => toggleRowSelection(row.id)}
                          disabled={row.isDuplicate}
                        />
                      </td>
                      <td className="border-r border-ecount-border">
                        {row.date}
                        {row.isDuplicate && <div className="text-[10px] text-red-500 font-bold leading-none mt-0.5">중복</div>}
                      </td>
                      <td className="text-left px-2 border-r border-ecount-border truncate max-w-[200px]" title={row.description}>{row.description}</td>
                      <td className="text-right px-2 font-bold border-r border-ecount-border text-gray-800">{row.amount.toLocaleString()}</td>
                      <td className={`border-r border-ecount-border ${row.type === '수입' ? 'text-ecount-blue font-bold' : 'text-red-600 font-bold'}`}>{row.type}</td>
                      <td className="p-1 border-r border-ecount-border">
                        <select 
                          value={row.category}
                          onChange={(e) => handleRowCategoryChange(row.id, e.target.value)}
                          disabled={row.isDuplicate}
                          className="w-full bg-transparent outline-none cursor-pointer"
                        >
                          {currentNodes.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1 border-r border-ecount-border">
                        <select 
                          value={row.subCategory}
                          onChange={(e) => handleRowSubCategoryChange(row.id, e.target.value)}
                          disabled={row.isDuplicate}
                          className="w-full bg-transparent outline-none cursor-pointer"
                        >
                          {currentNodes.find(c => c.name === row.category)?.subCategories.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <select 
                          value={row.wallet}
                          onChange={(e) => handleRowWalletChange(row.id, e.target.value as WalletType)}
                          disabled={row.isDuplicate || row.isWalletLocked}
                          className={`w-full outline-none cursor-pointer ${row.isWalletLocked ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-transparent"}`}
                        >
                          {wallets.map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
