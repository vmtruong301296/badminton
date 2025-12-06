import { formatCurrencyRounded } from '../../utils/formatters';

export default function PayOldBillsDialog({ isOpen, onClose, onPayCurrentOnly, onPayAll, playerName, debtAmount }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận thanh toán</h3>
          <p className="text-gray-600 mb-4">
            {playerName} có tiền nợ: <span className="font-semibold text-red-600">{formatCurrencyRounded(debtAmount || 0)}</span>
          </p>
          <p className="text-gray-700 mb-6">
            Bạn có muốn thanh toán cho các bill đã nợ trước đó không?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onPayCurrentOnly}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Chỉ bill hiện tại
            </button>
            <button
              type="button"
              onClick={onPayAll}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Cả bill cũ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

