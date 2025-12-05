import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { billsApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    player_id: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, billId: null });

  useEffect(() => {
    loadBills();
  }, [filters]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.player_id) params.player_id = filters.player_id;

      const response = await billsApi.getAll(params);
      setBills(response.data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (bill) => {
    const allPaid = bill.bill_players?.every((p) => p.is_paid);
    const somePaid = bill.bill_players?.some((p) => p.is_paid);
    
    if (allPaid) return 'bg-green-100 text-green-800';
    if (somePaid) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (bill) => {
    const allPaid = bill.bill_players?.every((p) => p.is_paid);
    const somePaid = bill.bill_players?.some((p) => p.is_paid);
    
    if (allPaid) return 'Đã thanh toán';
    if (somePaid) return 'Thanh toán một phần';
    return 'Chưa thanh toán';
  };

  const handleDeleteClick = (billId) => {
    setDeleteConfirm({ isOpen: true, billId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await billsApi.delete(deleteConfirm.billId);
      setDeleteConfirm({ isOpen: false, billId: null });
      loadBills(); // Reload bills after deletion
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Có lỗi xảy ra khi xóa bill');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, billId: null });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Danh sách Bills</h2>
        <Link
          to="/bills/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          ➕ Tạo Bill mới
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ date_from: '', date_to: '', player_id: '' })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : bills.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có bill nào</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(bill.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(bill.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill)}`}>
                      {getStatusText(bill)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.creator?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <Link
                        to={`/bills/${bill.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem chi tiết
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(bill.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa bill"
        message="Bạn có chắc chắn muốn xóa bill này? Hành động này không thể hoàn tác."
      />
    </div>
  );
}

