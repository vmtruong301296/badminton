import { formatCurrencyRounded, formatDate, formatRatio } from '../../utils/formatters';

export default function BillExport({ bill, paymentAccounts = [] }) {
  if (!bill) return null;

  // Get active payment accounts
  const activeAccounts = paymentAccounts.filter(acc => acc.is_active);

  const getImageUrl = (imagePath, imageUrl) => {
    if (imageUrl) return imageUrl;
    if (!imagePath) return null;
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `/storage/${cleanPath}`;
  };

  return (
    <div id="bill-export" className="bg-white p-6 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold mb-2">PHIẾU THU BADMINTON</h1>
        <p className="text-lg">Bill #{bill.id} - Ngày: {formatDate(bill.date)}</p>
      </div>

      {/* Bill Info */}
      <div className="mb-6 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <div className="text-sm text-gray-600 mb-1">Tổng tiền sân</div>
          <div className="text-lg font-semibold">{formatCurrencyRounded(bill.court_total)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Tổng tiền cầu</div>
          <div className="text-lg font-semibold">{formatCurrencyRounded(bill.total_shuttle_price)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Tổng tiền</div>
          <div className="text-xl font-bold text-blue-600">{formatCurrencyRounded(bill.total_amount)}</div>
        </div>
      </div>

      {/* Shuttles */}
      {bill.bill_shuttles && bill.bill_shuttles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Chi tiết cầu</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Loại cầu</th>
                <th className="border border-gray-300 px-3 py-2 text-right">SL</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Đơn giá</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {bill.bill_shuttles.map((shuttle, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-2">{shuttle.shuttle_type?.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{shuttle.quantity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrencyRounded(shuttle.price_each)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    {formatCurrencyRounded(shuttle.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Players Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Chi tiết người chơi</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">STT</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Tên</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Mức tính</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Chi phí thêm</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Tiền nợ</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Tổng tiền</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Đã TT</th>
            </tr>
          </thead>
          <tbody>
            {bill.bill_players?.map((player, index) => (
              <tr key={player.id}>
                <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-3 py-2 font-medium">{player.user?.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{formatRatio(player.ratio_value)}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {player.menu_extra_total > 0 ? (
                    <div className="text-right">
                      <div className="font-semibold mb-1">
                        {formatCurrencyRounded(player.menu_extra_total)}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        {player.bill_player_menus?.map((menuItem, idx) => (
                          <div key={idx} className="text-right">
                            {menuItem.menu?.name} × {menuItem.quantity} = {formatCurrencyRounded(menuItem.subtotal)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
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
                <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                  {formatCurrencyRounded(player.total_amount)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {player.is_paid ? '✓' : ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan="5" className="border border-gray-300 px-3 py-2 text-right">Tổng cộng:</td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {formatCurrencyRounded(
                  bill.bill_players?.reduce((sum, p) => sum + p.total_amount, 0) || 0
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note */}
      {bill.note && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm font-semibold mb-1">Ghi chú:</div>
          <div className="text-sm">{bill.note}</div>
        </div>
      )}

      {/* Payment Accounts with QR Codes */}
      {activeAccounts.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-center">THÔNG TIN THANH TOÁN</h3>
          <div className="grid grid-cols-2 gap-6">
            {activeAccounts.map((account) => (
              <div key={account.id} className="text-center p-4 bg-gray-50 rounded-lg border">
                <div className="mb-2">
                  <div className="font-semibold text-lg">{account.bank_name}</div>
                  <div className="text-sm text-gray-600">{account.account_holder_name}</div>
                  <div className="text-sm font-mono font-semibold">{account.account_number}</div>
                </div>
                {account.qr_code_image && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={getImageUrl(account.qr_code_image, account.qr_code_image_url)}
                      alt="QR Code"
                      className="w-48 h-48 border-2 border-gray-300 rounded"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                {account.note && (
                  <div className="mt-2 text-xs text-gray-600 italic">{account.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-600">
        <p>Người tạo: {bill.creator?.name || 'N/A'}</p>
        <p className="mt-1">Thời gian tạo: {new Date(bill.created_at).toLocaleString('vi-VN')}</p>
      </div>
    </div>
  );
}

