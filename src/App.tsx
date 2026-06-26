import { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  FileSpreadsheet, 
  Users, 
  FileText,
  Coffee,
  Menu,
  X,
  Settings,
  Tags,
  Users2
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { DataBackupManager } from './components/DataBackupManager';
import { DuesTracker } from './components/DuesTracker';
import { ReportGenerator } from './components/ReportGenerator';
import { SpecialBudgetTracker } from './components/SpecialBudgetTracker';
import { CategoryEditor } from './components/CategoryEditor';
import { SmallGroupEditor } from './components/SmallGroupEditor';
import { WalletBudgetEditor } from './components/WalletBudgetEditor';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard', name: '대시보드', icon: LayoutDashboard },
    { id: 'transaction', name: '전표입력', icon: Wallet },
    { id: 'dues', name: '회비대장', icon: Users },
    { id: 'special_budget', name: '심방/회식비 사용 현황', icon: Coffee },
    { id: 'report', name: '경영자보고서', icon: FileText },
  ];

  const settingTabs = [
    { id: 'import', name: '데이터 백업 및 엑셀 관리', icon: FileSpreadsheet },
    { id: 'wallet_budget_editor', name: '재원 및 예산 설정', icon: Wallet },
    { id: 'category_editor', name: '분류 편집', icon: Tags },
    { id: 'small_group_editor', name: '목장 관리', icon: Users2 },
  ];

  const renderNavMenu = () => (
    <>
      <nav className="flex-1 overflow-y-auto py-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center w-full px-3 py-2 text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-ecount-blue text-white font-medium'
                  : 'text-gray-700 hover:bg-ecount-rowHover'
              }`}
            >
              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{tab.name}</span>
            </button>
          );
        })}
        
        {/* Settings Folder */}
        <div className="mt-2">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:bg-ecount-rowHover"
          >
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate font-bold">기본 세팅</span>
            </div>
            <span className="text-xs">{isSettingsOpen ? '▼' : '▶'}</span>
          </button>
          
          {isSettingsOpen && (
            <div className="bg-gray-50 border-y border-ecount-border">
              {settingTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center w-full pl-8 pr-3 py-2 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-ecount-blue text-white font-medium'
                        : 'text-gray-700 hover:bg-ecount-rowHover'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                    <span className="truncate text-xs">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-ecount-gray text-gray-800 font-sans text-[13px]">
      {/* Top GNB (Global Navigation Bar) */}
      <header className="flex-shrink-0 h-10 bg-ecount-navy flex items-center justify-between px-4 text-white z-20">
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1 mr-2 text-white hover:bg-ecount-blue focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-[15px] font-bold tracking-tight">청년부 회계관리 시스템</h1>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span>관리자님</span>
          <button className="hover:underline">로그아웃</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LNB (Left Navigation Bar) - Desktop */}
        <aside className="hidden lg:flex w-52 flex-col bg-white border-r border-ecount-border z-10">
          <div className="px-3 py-2 bg-gray-100 border-b border-ecount-border text-xs font-bold text-gray-600">
            전체메뉴
          </div>
          {renderNavMenu()}
        </aside>

        {/* LNB - Mobile (Overlay) */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 top-10 z-40 lg:hidden flex">
            <div className="w-52 bg-white border-r border-ecount-border h-full shadow-lg flex flex-col">
              <div className="px-3 py-2 bg-gray-100 border-b border-ecount-border text-xs font-bold text-gray-600">
                전체메뉴
              </div>
              {renderNavMenu()}
            </div>
            <div 
              className="flex-1 bg-black/40 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-ecount-gray overflow-hidden">
          {/* MDI Tab bar (Fake) - typical in ERPs */}
          <div className="flex-shrink-0 h-8 bg-white border-b border-ecount-border flex items-end px-4 space-x-1">
            <div className="h-7 px-4 bg-ecount-gray border border-b-0 border-ecount-border flex items-center text-xs font-bold text-gray-800">
              {[...mainTabs, ...settingTabs].find(t => t.id === activeTab)?.name}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="bg-white border border-ecount-border h-full overflow-y-auto shadow-sm">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'transaction' && <TransactionForm />}
              {activeTab === 'import' && <DataBackupManager />}
              {activeTab === 'dues' && <DuesTracker />}
              {activeTab === 'special_budget' && <SpecialBudgetTracker />}
              {activeTab === 'report' && <ReportGenerator />}
              {activeTab === 'wallet_budget_editor' && <WalletBudgetEditor />}
              {activeTab === 'category_editor' && <CategoryEditor />}
              {activeTab === 'small_group_editor' && <SmallGroupEditor />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

