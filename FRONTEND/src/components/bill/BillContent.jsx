import { formatCurrencyRounded, formatDate, formatRatio } from '../../utils/formatters';

export default function BillContent({ bill, showHeader = true, onMarkPayment, isMainBill = false }) {
  if (!bill) return null;

  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="mb-4 pb-4 border-b">
          <h3 className="text-xl font-bold">Bill #{bill.id}</h3>
          <p className="text-sm text-gray-600">Ngày: {formatDate(bill.date)}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Bill Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600">Tổng tiền sân</div>
              <div className="text-sm font-semibold">{formatCurrencyRounded(bill.court_total)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Tổng tiền cầu</div>
              <div className="text-sm font-semibold">{formatCurrencyRounded(bill.total_shuttle_price)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Tổng tiền</div>
              <div className="text-sm font-bold text-blue-600">{formatCurrencyRounded(bill.total_amount)}</div>
            </div>
          </div>
        </div>

        {/* Shuttles */}
        {bill.bill_shuttles && bill.bill_shuttles.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="text-sm font-semibold mb-3">Chi tiết cầu</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Loại cầu</th>
                    <th className="text-right py-1">SL</th>
                    <th className="text-right py-1">Đơn giá</th>
                    <th className="text-right py-1">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.bill_shuttles.map((shuttle, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-1">{shuttle.shuttle_type?.name}</td>
                      <td className="text-right py-1">{shuttle.quantity}</td>
                      <td className="text-right py-1">{formatCurrencyRounded(shuttle.price_each)}</td>
                      <td className="text-right py-1 font-semibold">
                        {formatCurrencyRounded(shuttle.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Players Table */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-semibold mb-3">Chi tiết người chơi</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">STT</th>
                  <th className="text-left py-1">Tên</th>
                  <th className="text-right py-1">Mức tính</th>
                  <th className="text-right py-1">Chi phí thêm</th>
                  <th className="text-right py-1">Tiền nợ</th>
                  <th className="text-right py-1">Tổng tiền</th>
                  <th className="text-center py-1">Đã TT</th>
                </tr>
              </thead>
              <tbody>
                {bill.bill_players?.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className={`border-b ${!player.is_paid ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2 font-medium">{player.user?.name}</td>
                    <td className="text-right py-2">{formatRatio(player.ratio_value)}</td>
                    <td className="text-right py-2">
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
                    <td className="text-right py-2">
                      {player.debt_amount > 0 ? (
                        <div>
                          <div className="font-semibold mb-1">{formatCurrencyRounded(player.debt_amount)}</div>
                          {player.debt_details && player.debt_details.length > 0 && (
                            <div className="text-xs text-gray-600 space-y-1">
                              {player.debt_details.map((debt, idx) => (
                                <div key={idx} className="text-right">
                                  {formatDate(debt.date)}: {formatCurrencyRounded(debt.amount)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-right py-2 font-semibold">
                      {formatCurrencyRounded(player.total_amount)}
                    </td>
                    <td className="text-center py-2">
                      {isMainBill && onMarkPayment ? (
                        <input
                          type="checkbox"
                          checked={player.is_paid || false}
                          onChange={(e) => {
                            if (player.is_paid && !e.target.checked) {
                              e.preventDefault();
                              onMarkPayment(player.user_id, false);
                            } else {
                              onMarkPayment(player.user_id, e.target.checked);
                            }
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={player.is_paid || false}
                          disabled
                          className="w-4 h-4 cursor-not-allowed"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan="5" className="py-2 text-right">Tổng cộng:</td>
                  <td className="text-right py-2">
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
      </div>
    </div>
  );
}

