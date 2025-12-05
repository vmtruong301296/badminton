import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billsApi } from '../../services/api';
import { formatCurrency, formatDate, formatRatio } from '../../utils/formatters';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uncheckPaymentConfirm, setUncheckPaymentConfirm] = useState({ isOpen: false, playerId: null, playerName: '' });

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    try {
      setLoading(true);
      const response = await billsApi.getById(id);
      setBill(response.data);
    } catch (error) {
      console.error('Error loading bill:', error);
      alert('Không tìm thấy bill');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPayment = async (playerId, isPaid) => {
    // Nếu đang uncheck (từ checked -> unchecked), hiển thị confirm dialog
    if (!isPaid) {
      const player = bill.bill_players?.find((p) => p.user_id === playerId);
      if (player) {
        setUncheckPaymentConfirm({
          isOpen: true,
          playerId,
          playerName: player.user?.name || '',
        });
        return;
      }
    }

    // Nếu đang check (từ unchecked -> checked), gọi API trực tiếp
    await executeMarkPayment(playerId, isPaid);
  };

  const executeMarkPayment = async (playerId, isPaid) => {
    try {
      await billsApi.markPayment(id, playerId, {
        amount: bill.bill_players.find((p) => p.user_id === playerId)?.total_amount,
        is_paid: isPaid,
      });
      loadBill(); // Reload to get updated data
    } catch (error) {
      console.error('Error marking payment:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleUncheckPaymentConfirm = async () => {
    await executeMarkPayment(uncheckPaymentConfirm.playerId, false);
    setUncheckPaymentConfirm({ isOpen: false, playerId: null, playerName: '' });
  };

  const handleUncheckPaymentCancel = () => {
    setUncheckPaymentConfirm({ isOpen: false, playerId: null, playerName: '' });
    // Reload để đảm bảo checkbox trở về trạng thái ban đầu
    loadBill();
  };

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await billsApi.delete(id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Có lỗi xảy ra khi xóa bill');
      setDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!bill) {
    return <div className="text-center py-8">Không tìm thấy bill</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Chi tiết Bill</h2>
          <p className="text-gray-600">Ngày: {formatDate(bill.date)}</p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Xóa bill
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      {/* Bill Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Tổng tiền sân</div>
            <div className="text-lg font-semibold">{formatCurrency(bill.court_total)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tổng tiền cầu</div>
            <div className="text-lg font-semibold">{formatCurrency(bill.total_shuttle_price)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tổng tiền</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(bill.total_amount)}</div>
          </div>
        </div>
        {bill.note && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">Ghi chú:</div>
            <div className="text-gray-900">{bill.note}</div>
          </div>
        )}
      </div>

      {/* Shuttles */}
      {bill.bill_shuttles && bill.bill_shuttles.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Chi tiết cầu</h3>
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Loại cầu</th>
                <th className="text-right py-2">Số lượng</th>
                <th className="text-right py-2">Đơn giá</th>
                <th className="text-right py-2">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {bill.bill_shuttles.map((shuttle, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{shuttle.shuttle_type?.name}</td>
                  <td className="text-right py-2">{shuttle.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(shuttle.price_each)}</td>
                  <td className="text-right py-2 font-semibold">
                    {formatCurrency(shuttle.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Players Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Chi tiết người chơi</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">STT</th>
                <th className="text-left py-2">Tên</th>
                <th className="text-right py-2">Mức tính</th>
                <th className="text-right py-2">Chi phí thêm</th>
                <th className="text-right py-2">Tiền nợ</th>
                <th className="text-right py-2">Tổng tiền</th>
                <th className="text-center py-2">Đã thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {bill.bill_players?.map((player, index) => (
                <tr key={player.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{index + 1}</td>
                  <td className="py-3 font-medium">{player.user?.name}</td>
                  <td className="text-right py-3">{formatRatio(player.ratio_value)}</td>
                  <td className="text-right py-3">
                    {player.menu_extra_total > 0 ? (
                      <div className="text-right">
                        <div className="font-semibold mb-1">
                          {formatCurrency(player.menu_extra_total)}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {player.bill_player_menus?.map((menuItem, idx) => (
                            <div key={idx} className="text-right">
                              {menuItem.menu?.name} × {menuItem.quantity} = {formatCurrency(menuItem.subtotal)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-right py-3">
                    {player.debt_amount > 0 ? (
                      <div>
                        <div>{formatCurrency(player.debt_amount)}</div>
                        {player.debt_date && (
                          <div className="text-xs text-gray-500">
                            ({formatDate(player.debt_date)})
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-right py-3 font-semibold">
                    {formatCurrency(player.total_amount)}
                  </td>
                  <td className="text-center py-3">
                    <input
                      type="checkbox"
                      checked={player.is_paid || false}
                      onChange={(e) => {
                        // Nếu đang uncheck, prevent default và hiển thị dialog
                        if (player.is_paid && !e.target.checked) {
                          e.preventDefault();
                          handleMarkPayment(player.user_id, false);
                        } else {
                          // Nếu đang check, cho phép update ngay
                          handleMarkPayment(player.user_id, e.target.checked);
                        }
                      }}
                      className="w-5 h-5 cursor-pointer"
                    />
                    {player.paid_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(player.paid_at).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td colSpan="5" className="py-3 text-right">Tổng cộng:</td>
                <td className="text-right py-3">
                  {formatCurrency(
                    bill.bill_players?.reduce((sum, p) => sum + p.total_amount, 0) || 0
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa bill"
        message="Bạn có chắc chắn muốn xóa bill này? Hành động này không thể hoàn tác."
      />

      <ConfirmDialog
        isOpen={uncheckPaymentConfirm.isOpen}
        onClose={handleUncheckPaymentCancel}
        onConfirm={handleUncheckPaymentConfirm}
        title="Xác nhận hủy thanh toán"
        message={`Bạn có chắc chắn muốn hủy trạng thái "Đã thanh toán" cho ${uncheckPaymentConfirm.playerName}?`}
      />
    </div>
  );
}

