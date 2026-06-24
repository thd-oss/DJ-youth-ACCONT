import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType, WalletType } from '../types';
import { Save } from 'lucide-react';

export const TransactionForm: React.FC = () => {
  const { addTransaction, budgetConfig, categoryTree, wallets } = useFinance();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('지출');
  
  // 초기값 방어 로직
  const initialCategory = categoryTree.EXPENSE.length > 0 ? categoryTree.EXPENSE[0].name : '';
  const initialSubCategory = categoryTree.EXPENSE.length > 0 && categoryTree.EXPENSE[0].subCategories.length > 0 ? categoryTree.EXPENSE[0].subCategories[0] : '';
  
  const [category, setCategory] = useState(initialCategory);
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [wallet, setWallet] = useState<WalletType>(wallets[0] || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [targetId, setTargetId] = useState<string>('');
  const [isWalletLocked, setIsWalletLocked] = useState(true);

  const currentNodes = type === '수입' ? categoryTree.INCOME : categoryTree.EXPENSE;
  const activeNode = currentNodes.find(c => c.name === category) || currentNodes[0];

  const requireTarget = activeNode?.requireTarget || 'none';

  useEffect(() => {
    if (activeNode) {
      setWallet(activeNode.defaultWallet);
      setIsWalletLocked(activeNode.isWalletLocked);
      if (!activeNode.subCategories.includes(subCategory)) {
        setSubCategory(activeNode.subCategories[0] || '');
      }
    }
  }, [type, category, activeNode]);

  useEffect(() => {
    if (currentNodes.length > 0) {
      setCategory(currentNodes[0].name);
      setSubCategory(currentNodes[0].subCategories[0] || '');
    }
  }, [type]);

  useEffect(() => {
    if (requireTarget === 'smallGroup' && budgetConfig.organizations?.length > 0 && !targetId) {
      setTargetId(budgetConfig.organizations[0].id);
    }
    if (requireTarget === 'pastor') {
      setTargetId('pastor_visit'); // Fixed ID for pastor
    }
    if (requireTarget === 'none') {
      setTargetId('');
    }
  }, [requireTarget, budgetConfig.organizations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (requireTarget === 'smallGroup' && !targetId) {
      alert('해당 지출의 대상(목장)을 선택해주세요.');
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      type,
      wallet,
      category,
      subCategory,
      amount: Number(amount),
      description,
      targetId: requireTarget !== 'none' ? targetId : undefined
    };

    addTransaction(newTransaction);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-gray-800">전표 수동 입력</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              type="submit"
              className="flex items-center border border-ecount-border bg-gray-100 hover:bg-gray-200 px-4 h-8 text-xs font-bold text-gray-700"
            >
              <Save className="w-4 h-4 mr-1" />
              저장
            </button>
          </div>
        </div>
        
        <div className="border border-ecount-border bg-white shadow-sm">
          <table className="w-full text-left">
            <tbody>
              <tr>
                <th className="w-32 bg-gray-50 px-4">날짜</th>
                <td className="w-[calc(50%-8rem)] px-3 py-2">
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </td>
                <th className="w-32 bg-gray-50 px-4">구분</th>
                <td className="px-3 py-2">
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                  >
                    <option value="수입">수입</option>
                    <option value="지출">지출</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-4">대분류</th>
                <td className="px-3 py-2">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {currentNodes.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <th className="bg-gray-50 px-4">소분류</th>
                <td className="px-3 py-2">
                  <div className="flex space-x-2">
                    <select 
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="flex-1"
                    >
                      {activeNode?.subCategories.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {requireTarget === 'smallGroup' && (
                      <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="flex-1 bg-yellow-50 border-yellow-300"
                        required
                      >
                        <option value="" disabled>조직 선택</option>
                        {budgetConfig.organizations?.map(org => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    )}
                    {requireTarget === 'pastor' && (
                      <div className="flex-1 bg-gray-100 border border-ecount-border px-2 py-1 text-xs flex items-center text-gray-500">
                        목사님 (자동지정)
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-4 py-3 flex flex-col justify-center items-center h-full">
                  <span>지갑</span>
                  {isWalletLocked && <span className="text-[10px] text-red-500 font-normal leading-tight mt-1">(자동 고정)</span>}
                </th>
                <td className="px-3 py-2">
                    <select 
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value as WalletType)}
                      disabled={isWalletLocked}
                      className="disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      {wallets.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                </td>
                <th className="bg-gray-50 px-4">금액</th>
                <td className="px-3 py-2">
                  <input 
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="text-right pr-2"
                  />
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-4 py-3">적요 (내용)</th>
                <td colSpan={3} className="px-3 py-2">
                  <input 
                    type="text" 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="결제 내역 상세"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};
