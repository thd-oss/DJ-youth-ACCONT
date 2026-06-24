import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { CategoryNode, WalletType } from '../types';
import { Plus, Trash2, Lock, Unlock } from 'lucide-react';

export const CategoryEditor: React.FC = () => {
  const { categoryTree, updateCategoryTree, transactions, updateTransactions, wallets } = useFinance();
  const [activeTab, setActiveTab] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [autoUpdateTransactions, setAutoUpdateTransactions] = useState(true);

  const currentNodes = categoryTree[activeTab];

  const handleUpdateNode = (id: string, field: keyof CategoryNode, value: any, oldName?: string) => {
    const newTree = { ...categoryTree };
    const nodeIndex = newTree[activeTab].findIndex(n => n.id === id);
    if (nodeIndex === -1) return;

    newTree[activeTab][nodeIndex] = { ...newTree[activeTab][nodeIndex], [field]: value };
    updateCategoryTree(newTree);

    // If name was updated and auto-update is on
    if (field === 'name' && oldName && value !== oldName && autoUpdateTransactions) {
      const typeStr = activeTab === 'INCOME' ? '수입' : '지출';
      const relatedTxs = transactions.filter(t => t.type === typeStr && t.category === oldName);
      
      if (relatedTxs.length > 0) {
        const updatedTxs = relatedTxs.map(t => ({ ...t, category: value }));
        updateTransactions(updatedTxs);
      }
    }
  };

  const handleUpdateSubCategory = (nodeId: string, oldSub: string, newSub: string) => {
    if (!newSub.trim()) return;
    
    const newTree = { ...categoryTree };
    const nodeIndex = newTree[activeTab].findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = newTree[activeTab][nodeIndex];
    const subIndex = node.subCategories.indexOf(oldSub);
    if (subIndex === -1) return;

    node.subCategories[subIndex] = newSub;
    updateCategoryTree(newTree);

    if (autoUpdateTransactions) {
      const typeStr = activeTab === 'INCOME' ? '수입' : '지출';
      const relatedTxs = transactions.filter(t => t.type === typeStr && t.category === node.name && t.subCategory === oldSub);
      
      if (relatedTxs.length > 0) {
        const updatedTxs = relatedTxs.map(t => ({ ...t, subCategory: newSub }));
        updateTransactions(updatedTxs);
      }
    }
  };

  const handleDeleteSubCategory = (nodeId: string, sub: string) => {
    const newTree = { ...categoryTree };
    const nodeIndex = newTree[activeTab].findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    newTree[activeTab][nodeIndex].subCategories = newTree[activeTab][nodeIndex].subCategories.filter(s => s !== sub);
    updateCategoryTree(newTree);
  };

  const handleAddSubCategory = (nodeId: string) => {
    const newSub = prompt('추가할 소분류 이름을 입력하세요.');
    if (!newSub || !newSub.trim()) return;

    const newTree = { ...categoryTree };
    const nodeIndex = newTree[activeTab].findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    if (!newTree[activeTab][nodeIndex].subCategories.includes(newSub.trim())) {
      newTree[activeTab][nodeIndex].subCategories.push(newSub.trim());
      updateCategoryTree(newTree);
    }
  };

  const handleAddNode = () => {
    const newTree = { ...categoryTree };
    const newId = `${activeTab.toLowerCase()}_${Date.now()}`;
    newTree[activeTab].push({
      id: newId,
      name: '새 대분류',
      subCategories: ['기본 소분류'],
      defaultWallet: wallets[0] || '',
      isWalletLocked: false,
      requireTarget: 'none'
    });
    updateCategoryTree(newTree);
  };

  const handleDeleteNode = (id: string) => {
    if (!confirm('이 대분류를 정말 삭제하시겠습니까? (기존 전표의 데이터는 유지됩니다)')) return;
    const newTree = { ...categoryTree };
    newTree[activeTab] = newTree[activeTab].filter(n => n.id !== id);
    updateCategoryTree(newTree);
  };

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-4 px-2">
        <h2 className="text-base font-bold text-gray-800">분류 편집 (카테고리 설정)</h2>
        <div className="flex items-center text-xs text-gray-600">
          <input 
            type="checkbox" 
            id="autoUpdate" 
            checked={autoUpdateTransactions}
            onChange={(e) => setAutoUpdateTransactions(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="autoUpdate">분류명 수정 시 기존 전표 일괄 업데이트</label>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-ecount-border mb-4">
        {(['INCOME', 'EXPENSE'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-ecount-navy text-ecount-navy' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab === 'INCOME' ? '수입 분류' : '지출 분류'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mb-4">
          <button 
            onClick={handleAddNode}
            className="flex items-center border border-ecount-border bg-white hover:bg-ecount-rowHover px-3 py-1.5 text-xs font-bold text-ecount-navy shadow-sm"
          >
            <Plus className="w-3 h-3 mr-1" /> 새 대분류 추가
          </button>
        </div>

        <div className="border border-ecount-border overflow-x-auto">
          <table className="w-full text-xs bg-white text-left whitespace-nowrap min-w-max">
            <thead className="bg-gray-100 border-b border-ecount-border">
              <tr>
                <th className="px-3 py-2 border-r border-ecount-border w-40">대분류명</th>
                <th className="px-3 py-2 border-r border-ecount-border max-w-[300px]">소분류 목록</th>
                <th className="px-3 py-2 border-r border-ecount-border w-24 text-center">기본 지갑</th>
                <th className="px-3 py-2 border-r border-ecount-border w-24 text-center">지갑 고정</th>
                <th className="px-3 py-2 border-r border-ecount-border w-40 text-center">연동 타겟</th>
                <th className="px-3 py-2 w-16 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {currentNodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">등록된 분류가 없습니다.</td>
                </tr>
              ) : (
                currentNodes.map(node => (
                  <tr key={node.id} className="border-b border-ecount-border hover:bg-yellow-50/30 transition-colors align-top">
                    {/* 대분류명 */}
                    <td className="px-3 py-2 border-r border-ecount-border">
                      <input 
                        type="text" 
                        value={node.name}
                        onChange={(e) => handleUpdateNode(node.id, 'name', e.target.value, node.name)}
                        className="font-bold w-full h-7 px-2 border border-transparent hover:border-ecount-border focus:border-ecount-blue focus:bg-white transition-colors focus:outline-none"
                      />
                    </td>
                    
                    {/* 소분류 목록 */}
                    <td className="px-3 py-2 border-r border-ecount-border max-w-[350px] whitespace-normal">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {node.subCategories.map((sub, idx) => (
                          <div key={idx} className="flex items-center bg-gray-50 border border-ecount-border text-gray-700 h-6 pl-2 pr-1 shadow-sm">
                            <input 
                              type="text" 
                              value={sub}
                              onChange={(e) => handleUpdateSubCategory(node.id, sub, e.target.value)}
                              className="text-xs w-20 px-1 bg-transparent border-none focus:outline-none focus:ring-0 focus:bg-white focus:w-28 transition-all"
                            />
                            <button 
                              onClick={() => handleDeleteSubCategory(node.id, sub)}
                              className="text-gray-400 hover:text-red-500 ml-1 opacity-70 hover:opacity-100 transition-opacity"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddSubCategory(node.id)}
                          className="flex items-center text-xs text-ecount-blue hover:text-blue-700 h-6 px-2 border border-transparent hover:border-ecount-blue hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="w-3 h-3 mr-0.5" /> 추가
                        </button>
                      </div>
                    </td>

                    {/* 기본 지갑 */}
                    <td className="px-3 py-2 border-r border-ecount-border text-center align-middle">
                      <select 
                        value={node.defaultWallet}
                        onChange={(e) => handleUpdateNode(node.id, 'defaultWallet', e.target.value as WalletType)}
                        className="w-full text-center border-transparent hover:border-ecount-border focus:border-ecount-blue focus:ring-0 focus:outline-none cursor-pointer p-1"
                      >
                        {wallets.map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </td>

                    {/* 지갑 고정 */}
                    <td className="px-3 py-2 border-r border-ecount-border text-center align-middle">
                      <label className="flex items-center justify-center cursor-pointer group hover:bg-gray-50 p-1 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          checked={node.isWalletLocked}
                          onChange={(e) => handleUpdateNode(node.id, 'isWalletLocked', e.target.checked)}
                          className="hidden"
                        />
                        {node.isWalletLocked ? (
                          <div className="flex items-center text-red-500 font-bold">
                            <Lock className="w-3 h-3 mr-1" /> 고정됨
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 group-hover:text-gray-600">
                            <Unlock className="w-3 h-3 mr-1" /> 선택가능
                          </div>
                        )}
                      </label>
                    </td>

                    {/* 연동 타겟 */}
                    <td className="px-3 py-2 border-r border-ecount-border text-center align-middle">
                      <select 
                        value={node.requireTarget || 'none'}
                        onChange={(e) => handleUpdateNode(node.id, 'requireTarget', e.target.value)}
                        className="w-full text-center border-transparent hover:border-ecount-border focus:border-ecount-blue focus:ring-0 focus:outline-none cursor-pointer p-1 text-gray-700"
                      >
                        <option value="none">- 해당 없음 -</option>
                        <option value="pastor">👤 목사님 (심방)</option>
                        <option value="smallGroup">👥 목장/팀 (조직)</option>
                      </select>
                    </td>

                    {/* 관리 */}
                    <td className="px-3 py-2 text-center align-middle">
                      <button 
                        onClick={() => handleDeleteNode(node.id)} 
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="대분류 삭제"
                      >
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
