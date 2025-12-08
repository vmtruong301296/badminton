import { useState, useEffect } from 'react';

export default function SelectPaymentAccountDialog({ isOpen, onClose, onConfirm, paymentAccounts = [] }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const activeAccounts = paymentAccounts.filter((acc) => acc.is_active);

  // Tự động chọn tài khoản VPbank khi modal mở
  useEffect(() => {
    if (isOpen) {
      const activeAccounts = paymentAccounts.filter((acc) => acc.is_active);
      if (activeAccounts.length > 0) {
        const vpbankAccount = activeAccounts.find((acc) => acc.bank_name === 'VPBank');
        if (vpbankAccount) {
          setSelectedAccountId(vpbankAccount.id);
        } else {
          // Nếu không tìm thấy VPbank, chọn tài khoản đầu tiên
          setSelectedAccountId(activeAccounts[0].id);
        }
      }
    } else {
      // Reset khi đóng modal
      setSelectedAccountId(null);
    }
  }, [isOpen, paymentAccounts]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedAccountId) {
      onConfirm(selectedAccountId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn tài khoản thanh toán</h3>
          {activeAccounts.length === 0 ? (
            <p className="text-gray-600 mb-6">Không có tài khoản thanh toán nào đang hoạt động.</p>
          ) : (
            <div className="mb-6">
              <div className="space-y-2">
                {activeAccounts.map((account) => (
                  <label
                    key={account.id}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAccountId === account.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentAccount"
                      value={account.id}
                      checked={selectedAccountId === account.id}
                      onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                      className="mr-3 w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {account.bank_name || `Tài khoản ${account.id}`}
                      </div>
                      {account.account_number && (
                        <div className="text-sm text-gray-600">Số tài khoản: {account.account_number}</div>
                      )}
                      {account.note && (
                        <div className="text-xs text-gray-500 mt-1">{account.note}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAccountId || activeAccounts.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

