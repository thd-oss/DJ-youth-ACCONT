import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, PlusCircle } from 'lucide-react';
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

export const CsvImport: React.FC = () => {
  const { transactions, addTransactions, categoryTree } = useFinance();
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
        const defaultWallet = defaultNode ? defaultNode.defaultWallet : '교부금';
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

    event.target.value = '';
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

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-gray-800">CSV / 엑셀 내역 가져오기</h2>
        </div>
      </div>

      <div className="border border-ecount-border p-6 md:p-8 mb-6 flex flex-col items-center justify-center bg-gray-50 shadow-sm">
        <Upload className="w-8 h-8 text-gray-400 mb-3" />
        <h3 className="text-sm font-bold text-ecount-navy mb-2">은행 거래내역 CSV/엑셀 파일 업로드</h3>
        <p className="text-xs text-gray-500 mb-5 text-center max-w-md leading-relaxed">
          자동으로 헤더를 분석하여 내역을 분류하며, 기존 장부와 중복되는 항목은 제외됩니다.
        </p>
        <label className="cursor-pointer border border-ecount-border bg-white hover:bg-ecount-rowHover px-6 py-2 text-xs font-bold text-gray-700 shadow-sm">
          <span>{isProcessing ? '처리 중...' : '파일 선택 (CSV/XLSX)'}</span>
          <input  
            type="file" 
            accept=".csv, .xlsx, .xls" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </label>
      </div>

      {previewData.length > 0 && (
        <div className="flex-1 flex flex-col border border-ecount-border bg-white overflow-hidden">
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
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-center">
              <thead className="sticky top-0 bg-gray-200 z-10">
                <tr>
                  <th className="w-8">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setPreviewData(prev => prev.map(r => (!r.isDuplicate ? { ...r, selected: isChecked } : r)));
                      }}
                      checked={previewData.some(r => r.selected)}
                    />
                  </th>
                  <th className="w-24">날짜</th>
                  <th>적요 (내용)</th>
                  <th className="w-24">금액</th>
                  <th className="w-16">구분</th>
                  <th className="w-28">대분류</th>
                  <th className="w-28">소분류</th>
                  <th className="w-24">지갑</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row) => {
                  const currentNodes = row.type === '수입' ? categoryTree.INCOME : categoryTree.EXPENSE;
                  
                  return (
                    <tr key={row.id} className={row.isDuplicate ? 'bg-red-50 text-gray-400' : 'hover:bg-ecount-rowHover'}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={row.selected}
                          onChange={() => toggleRowSelection(row.id)}
                          disabled={row.isDuplicate}
                        />
                      </td>
                      <td>
                        {row.date}
                        {row.isDuplicate && <div className="text-[10px] text-red-500 font-bold leading-none mt-0.5">중복</div>}
                      </td>
                      <td className="text-left px-2">{row.description}</td>
                      <td className="text-right px-2 font-bold text-gray-800">{row.amount.toLocaleString()}</td>
                      <td className={row.type === '수입' ? 'text-ecount-blue font-bold' : 'text-red-600 font-bold'}>{row.type}</td>
                      <td className="p-1">
                        <select 
                          value={row.category}
                          onChange={(e) => handleRowCategoryChange(row.id, e.target.value)}
                          disabled={row.isDuplicate}
                        >
                          {currentNodes.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <select 
                          value={row.subCategory}
                          onChange={(e) => handleRowSubCategoryChange(row.id, e.target.value)}
                          disabled={row.isDuplicate}
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
                          className={row.isWalletLocked ? "bg-gray-100 text-gray-500" : ""}
                        >
                          <option value="교부금">교부금</option>
                          <option value="회비">회비</option>
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
