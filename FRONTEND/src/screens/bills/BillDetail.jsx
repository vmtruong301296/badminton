import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billsApi, paymentAccountsApi } from '../../services/api';
import { formatCurrency, formatCurrencyRounded, formatDate, formatRatio } from '../../utils/formatters';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BillContent from '../../components/bill/BillContent';
import BillExport from '../../components/bill/BillExport';
import html2canvas from 'html2canvas';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uncheckPaymentConfirm, setUncheckPaymentConfirm] = useState({ isOpen: false, playerId: null, playerName: '' });
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    loadBill();
    loadPaymentAccounts();
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
      const response = await billsApi.markPayment(id, playerId, {
        amount: bill.bill_players.find((p) => p.user_id === playerId)?.total_amount,
        is_paid: isPaid,
      });
      // Cập nhật state từ response thay vì reload toàn bộ trang
      if (response.data && response.data.bill) {
        setBill(response.data.bill);
      }
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

  const loadPaymentAccounts = async () => {
    try {
      const response = await paymentAccountsApi.getAll({ is_active: true });
      setPaymentAccounts(response.data);
    } catch (error) {
      console.error('Error loading payment accounts:', error);
    }
  };

  const handleExportBill = async () => {
    if (!bill || !exportRef.current) return;

    try {
      setExporting(true);
      
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      // Convert canvas to image and download
      const link = document.createElement('a');
      link.download = `Bill_${bill.id}_${formatDate(bill.date).replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setExporting(false);
    } catch (error) {
      console.error('Error exporting bill:', error);
      alert('Có lỗi xảy ra khi xuất bill');
      setExporting(false);
    }
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
            onClick={handleExportBill}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Đang xuất...' : '📄 Xuất Bill'}
          </button>
          {!bill.parent_bill_id && (
            <button
              type="button"
              onClick={() => navigate(`/bills/create?parent_id=${id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              + Tạo Bill con
            </button>
          )}
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

      {/* Layout 2 cột nếu có sub-bills, 1 cột nếu không */}
      {!bill.parent_bill_id && bill.sub_bills && bill.sub_bills.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Cột trái: Bill chính */}
          <div className="bg-gray-50 p-4 rounded-lg shadow border-2 border-blue-200 flex flex-col">
            <div className="mb-3 pb-3 border-b border-blue-300">
              <h3 className="text-lg font-bold text-blue-900">Bill chính #{bill.id}</h3>
            </div>
            <BillContent 
              bill={bill} 
              showHeader={false} 
              onMarkPayment={handleMarkPayment}
              isMainBill={true}
            />
          </div>

          {/* Cột phải: Bill con */}
          <div className="space-y-4 overflow-y-auto">
            {bill.sub_bills.map((subBill) => (
              <div key={subBill.id} className="bg-gray-50 p-4 rounded-lg shadow border-2 border-green-200 flex flex-col">
                <div className="mb-3 pb-3 border-b border-green-300">
                  <h3 className="text-lg font-bold text-green-900">Bill con #{subBill.id}</h3>
                  <p className="text-xs text-gray-600">Ngày: {formatDate(subBill.date)}</p>
                </div>
                <BillContent bill={subBill} showHeader={false} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Bill Info */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Tổng tiền sân</div>
            <div className="text-lg font-semibold">{formatCurrencyRounded(bill.court_total)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tổng tiền cầu</div>
            <div className="text-lg font-semibold">{formatCurrencyRounded(bill.total_shuttle_price)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tổng tiền</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrencyRounded(bill.total_amount)}</div>
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
                  <td className="text-right py-2">{formatCurrencyRounded(shuttle.price_each)}</td>
                  <td className="text-right py-2 font-semibold">
                    {formatCurrencyRounded(shuttle.subtotal)}
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
                          {formatCurrencyRounded(player.menu_extra_total)}
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
                        <div>{formatCurrencyRounded(player.debt_amount)}</div>
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
                    {formatCurrencyRounded(player.total_amount)}
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
                  {formatCurrencyRounded(
                    bill.bill_players?.reduce((sum, p) => sum + p.total_amount, 0) || 0
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Parent Bill Info - Only show if this is a sub-bill */}
      {bill.parent_bill_id && bill.parent_bill && (
        <div className="bg-blue-50 p-6 rounded-lg shadow mt-6 border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Bill con của</h3>
              <p className="text-sm text-gray-700">
                Bill chính #{bill.parent_bill.id} | 
                Ngày: {formatDate(bill.parent_bill.date)} | 
                Tổng tiền: {formatCurrencyRounded(bill.parent_bill.total_amount)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/bills/${bill.parent_bill.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Xem Bill chính
            </button>
          </div>
        </div>
      )}

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

      {/* Hidden export component for image generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={exportRef}>
          <BillExport bill={bill} paymentAccounts={paymentAccounts} />
        </div>
      </div>
    </div>
  );
}

