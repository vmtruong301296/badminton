import { useSearchParams } from 'react-router-dom';
import RatiosManagement from '../ratios/RatiosManagement';
import MenusManagement from '../menus/MenusManagement';
import ShuttlesManagement from '../shuttles/ShuttlesManagement';
import PaymentAccountsManagement from '../payment-accounts/PaymentAccountsManagement';

const TABS = [
  { id: 'ratios', label: 'Mức tính', icon: '⚖️', component: RatiosManagement },
  { id: 'menus', label: 'Menu nước', icon: '🥤', component: MenusManagement },
  { id: 'shuttles', label: 'Loại cầu', icon: '🏸', component: ShuttlesManagement },
  { id: 'payment-accounts', label: 'TK nhận tiền', icon: '💳', component: PaymentAccountsManagement },
];

export default function MasterManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ratios';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || RatiosManagement;

  return (
    <div className="px-2 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          Quản lý Master
        </h1>
        
        {/* Mobile: Grid Buttons */}
        <div className="md:hidden mb-4">
          <div className="grid grid-cols-2 gap-3">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                    ${isActive
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-3xl mb-2">{tab.icon}</span>
                  <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="mt-1 w-8 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: Horizontal Tabs */}
        <div className="hidden md:block border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 sm:mt-6">
        <ActiveComponent />
      </div>
    </div>
  );
}

