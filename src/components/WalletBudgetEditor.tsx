import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export const WalletBudgetEditor: React.FC = () => {
  const { 
    wallets, 
    addWallet, 
    renameWallet, 
    deleteWallet,
    budgetConfig,
    updateBudgetConfig
  } = useFinance();

  const [newWalletName, setNewWalletName] = useState('');
  const [editingWallet, setEditingWallet] = useState<{old: string, new: string} | null>(null);

  const [newSpecialBudgetName, setNewSpecialBudgetName] = useState('');
  const [newSpecialBudgetQuarterly, setNewSpecialBudgetQuarterly] = useState('');
  const [newSpecialBudgetYearly, setNewSpecialBudgetYearly] = useState('');

  // --- Wallet Handlers ---
  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    if (wallets.includes(newWalletName.trim())) {
      alert('이미 존재하는 지갑 이름입니다.');
      return;
    }
    addWallet(newWalletName);
    setNewWalletName('');
  };

  const handleRenameWallet = (oldName: string) => {
    if (!editingWallet || !editingWallet.new.trim() || editingWallet.new === oldName) {
      setEditingWallet(null);
      return;
    }
    if (wallets.includes(editingWallet.new.trim())) {
      alert('이미 존재하는 지갑 이름입니다.');
      return;
    }
    if (confirm(`'${oldName}'을(를) '${editingWallet.new}'(으)로 변경하시겠습니까?\n과거 작성된 전표들도 모두 새 이름으로 업데이트됩니다.`)) {
      renameWallet(oldName, editingWallet.new);
      setEditingWallet(null);
    }
  };

  const handleDeleteWallet = (name: string) => {
    if (confirm(`'${name}' 지갑을 정말 삭제하시겠습니까?\n(기존에 이 지갑으로 작성된 전표의 텍스트는 유지됩니다)`)) {
      deleteWallet(name);
    }
  };

  // --- Special Budget Handlers ---
  const handleAddSpecialBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialBudgetName.trim()) return;
    
    const newBudget = {
      id: `special_${Date.now()}`,
      name: newSpecialBudgetName.trim(),
      quarterlyLimit: Number(newSpecialBudgetQuarterly) || 0,
      yearlyLimit: Number(newSpecialBudgetYearly) || 0,
    };

    updateBudgetConfig({
      ...budgetConfig,
      specialBudgets: [...budgetConfig.specialBudgets, newBudget]
    });

    setNewSpecialBudgetName('');
    setNewSpecialBudgetQuarterly('');
    setNewSpecialBudgetYearly('');
  };

  const handleDeleteSpecialBudget = (id: string) => {
    if (confirm('이 특별 예산을 삭제하시겠습니까?')) {
      updateBudgetConfig({
        ...budgetConfig,
        specialBudgets: budgetConfig.specialBudgets.filter(b => b.id !== id)
      });
    }
  };

  const handleUpdateSpecialBudget = (id: string, field: 'name' | 'quarterlyLimit' | 'yearlyLimit', value: any) => {
    const updated = budgetConfig.specialBudgets.map(b => {
      if (b.id === id) {
        return { ...b, [field]: value };
      }
      return b;
    });
    updateBudgetConfig({ ...budgetConfig, specialBudgets: updated });
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5 overflow-auto">
      <div className="border-b border-ecount-border pb-3 mb-6 px-2">
        <h2 className="text-base font-bold text-gray-800">재원 및 특별 예산 설정</h2>
        <p className="text-xs text-gray-500 mt-1">지갑(재원)과 특별 예산 항목을 상시로 추가, 수정, 삭제할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Wallets */}
        <div>
          <h3 className="text-sm font-bold text-ecount-navy mb-3 flex items-center">
            <span className="w-2 h-2 bg-ecount-navy mr-2"></span>
            지갑(재원) 관리
          </h3>
          
          <div className="border border-ecount-border bg-white mb-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 border-b border-ecount-border">
                <tr>
                  <th className="px-3 py-2 border-r border-ecount-border">지갑명</th>
                  <th className="px-3 py-2 w-24 text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(wallet => (
                  <tr key={wallet} className="border-b border-ecount-border hover:bg-yellow-50/30">
                    <td className="px-3 py-2 border-r border-ecount-border">
                      {editingWallet?.old === wallet ? (
                        <input 
                          type="text" 
                          value={editingWallet.new}
                          onChange={(e) => setEditingWallet({ ...editingWallet, new: e.target.value })}
                          className="font-bold w-full px-2 py-1 border border-ecount-blue focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameWallet(wallet);
                            if (e.key === 'Escape') setEditingWallet(null);
                          }}
                        />
                      ) : (
                        <span className="font-bold text-gray-800">{wallet}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {editingWallet?.old === wallet ? (
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => handleRenameWallet(wallet)} className="text-ecount-blue hover:text-blue-700" title="저장">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingWallet(null)} className="text-gray-400 hover:text-gray-600" title="취소">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center space-x-3">
                          <button 
                            onClick={() => setEditingWallet({ old: wallet, new: wallet })}
                            className="text-gray-400 hover:text-ecount-navy"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteWallet(wallet)} 
                            className="text-gray-400 hover:text-red-500"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddWallet} className="flex space-x-2">
            <input 
              type="text" 
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="새 지갑 이름 (예: 목적헌금)"
              className="flex-1 text-xs border border-ecount-border px-3 py-2 focus:border-ecount-blue focus:outline-none"
            />
            <button 
              type="submit"
              disabled={!newWalletName.trim()}
              className="flex items-center bg-ecount-navy text-white px-3 py-2 text-xs font-bold disabled:opacity-50"
            >
              <Plus className="w-3 h-3 mr-1" /> 추가
            </button>
          </form>
        </div>

        {/* Right Column: Special Budgets */}
        <div>
          <h3 className="text-sm font-bold text-ecount-navy mb-3 flex items-center">
            <span className="w-2 h-2 bg-ecount-navy mr-2"></span>
            특별 예산 (조직 외 항목)
          </h3>
          
          <div className="border border-ecount-border bg-white mb-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 border-b border-ecount-border">
                <tr>
                  <th className="px-3 py-2 border-r border-ecount-border">예산 항목명</th>
                  <th className="px-3 py-2 border-r border-ecount-border w-24 text-right">분기 한도</th>
                  <th className="px-3 py-2 border-r border-ecount-border w-24 text-right">연간 한도</th>
                  <th className="px-3 py-2 w-12 text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {budgetConfig.specialBudgets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">등록된 특별 예산이 없습니다.</td>
                  </tr>
                ) : (
                  budgetConfig.specialBudgets.map(budget => (
                    <tr key={budget.id} className="border-b border-ecount-border hover:bg-yellow-50/30">
                      <td className="px-3 py-1.5 border-r border-ecount-border">
                        <input 
                          type="text"
                          value={budget.name}
                          onChange={(e) => handleUpdateSpecialBudget(budget.id, 'name', e.target.value)}
                          className="w-full font-bold px-1 py-1 border border-transparent focus:border-ecount-blue focus:bg-white focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-ecount-border">
                        <input 
                          type="number"
                          value={budget.quarterlyLimit}
                          onChange={(e) => handleUpdateSpecialBudget(budget.id, 'quarterlyLimit', Number(e.target.value))}
                          className="w-full text-right px-1 py-1 border border-transparent focus:border-ecount-blue focus:bg-white focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-ecount-border">
                        <input 
                          type="number"
                          value={budget.yearlyLimit}
                          onChange={(e) => handleUpdateSpecialBudget(budget.id, 'yearlyLimit', Number(e.target.value))}
                          className="w-full text-right px-1 py-1 border border-transparent focus:border-ecount-blue focus:bg-white focus:outline-none bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button 
                          onClick={() => handleDeleteSpecialBudget(budget.id)} 
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddSpecialBudget} className="flex space-x-2">
            <input 
              type="text" 
              value={newSpecialBudgetName}
              onChange={(e) => setNewSpecialBudgetName(e.target.value)}
              placeholder="예: 경조사 지원"
              className="flex-1 text-xs border border-ecount-border px-2 py-2 focus:border-ecount-blue focus:outline-none"
            />
            <input 
              type="number" 
              value={newSpecialBudgetQuarterly}
              onChange={(e) => setNewSpecialBudgetQuarterly(e.target.value)}
              placeholder="분기 한도"
              className="w-20 text-xs border border-ecount-border px-2 py-2 focus:border-ecount-blue focus:outline-none text-right"
            />
            <input 
              type="number" 
              value={newSpecialBudgetYearly}
              onChange={(e) => setNewSpecialBudgetYearly(e.target.value)}
              placeholder="연간 한도"
              className="w-20 text-xs border border-ecount-border px-2 py-2 focus:border-ecount-blue focus:outline-none text-right"
            />
            <button 
              type="submit"
              disabled={!newSpecialBudgetName.trim()}
              className="flex items-center bg-ecount-navy text-white px-3 py-2 text-xs font-bold disabled:opacity-50"
            >
              <Plus className="w-3 h-3 mr-1" /> 추가
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
