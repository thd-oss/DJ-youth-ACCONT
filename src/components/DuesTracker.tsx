import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { Member } from '../types';
import { UserPlus, Filter, Check, X } from 'lucide-react';

export const DuesTracker: React.FC = () => {
  const { members, addMember, updateMember, budgetConfig } = useFinance();
  const [newMemberName, setNewMemberName] = useState('');
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const currentYear = budgetConfig.year;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: Member = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      status: '활동',
      duesPaid: {}
    };

    addMember(newMember);
    setNewMemberName('');
  };

  const toggleDues = (member: Member, month: number) => {
    const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
    const isPaid = member.duesPaid[monthKey] || false;
    
    updateMember(member.id, {
      ...member,
      duesPaid: {
        ...member.duesPaid,
        [monthKey]: !isPaid
      }
    });
  };

  const currentMonth = new Date().getMonth() + 1;
  
  const hasUnpaid = (member: Member) => {
    for (let m = 1; m <= currentMonth; m++) {
      const monthKey = `${currentYear}-${m.toString().padStart(2, '0')}`;
      if (!member.duesPaid[monthKey]) {
        return true;
      }
    }
    return false;
  };

  const filteredMembers = showUnpaidOnly 
    ? members.filter(m => m.status === '활동' && hasUnpaid(m))
    : members.filter(m => m.status === '활동');

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-5">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-ecount-border pb-3 mb-6 px-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-gray-800">회비대장 ({currentYear}년)</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
            className={`flex items-center border border-ecount-border px-3 h-8 text-xs font-bold transition-colors ${
              showUnpaidOnly 
                ? 'bg-rose-50 text-rose-700' 
                : 'bg-white text-gray-700 hover:bg-ecount-rowHover'
            }`}
          >
            <Filter className="w-3 h-3 mr-1" />
            미납자 조회 (당월 기준)
          </button>
        </div>
      </div>

      <div className="flex items-center border border-ecount-border p-3 bg-gray-50 mb-4 shadow-sm">
        <form onSubmit={handleAddMember} className="flex items-center gap-2 w-full max-w-sm">
          <label className="text-xs font-bold text-gray-700 mr-2">신규 등록:</label>
          <input 
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="새 청년 이름"
            className="w-32 text-xs"
          />
          <button 
            type="submit"
            className="flex items-center border border-ecount-border bg-white hover:bg-ecount-rowHover px-3 h-8 text-xs font-bold text-gray-700"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            추가
          </button>
        </form>
      </div>

      <div className="flex-1 flex flex-col border border-ecount-border bg-white overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-center border-collapse">
            <thead className="sticky top-0 bg-gray-200 z-10 text-xs text-gray-700">
              <tr>
                <th className="w-20 font-bold">이름</th>
                {months.map(m => (
                  <th key={m} className="w-10 font-bold">{m}월</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                    {showUnpaidOnly ? "미납자가 없습니다." : "등록된 청년이 없습니다."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-ecount-rowHover">
                    <td className="font-bold text-gray-800 bg-gray-50">{member.name}</td>
                    {months.map(month => {
                      const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
                      const isPaid = member.duesPaid[monthKey];
                      const isPastOrCurrent = month <= currentMonth;
                      
                      return (
                        <td 
                          key={month} 
                          className="p-0 border border-ecount-border"
                        >
                          <button
                            onClick={() => toggleDues(member, month)}
                            className={`w-full h-8 flex items-center justify-center transition-colors cursor-pointer rounded-none border-0 ${
                              isPaid 
                                ? 'bg-blue-50 text-ecount-blue' 
                                : isPastOrCurrent 
                                  ? 'bg-white text-rose-500' 
                                  : 'bg-gray-50 text-gray-300'
                            }`}
                          >
                            {isPaid ? <Check className="w-4 h-4 font-bold" /> : (isPastOrCurrent ? <X className="w-3 h-3" /> : '')}
                          </button>
                        </td>
                      );
                    })}
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
