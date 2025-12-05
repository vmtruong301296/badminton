import { useMemo } from 'react';
import { formatCurrencyRounded, formatDate, formatRatio } from '../../utils/formatters';

export default function BillExport({ bill, paymentAccounts = [], paymentAccountImages = {} }) {
  if (!bill) return null;

  // Get active payment accounts (memoized to avoid re-renders)
  const activeAccounts = useMemo(() => {
    return paymentAccounts.filter(acc => acc.is_active);
  }, [paymentAccounts]);

  const getImageUrl = (imagePath, imageUrl) => {
    // Prefer full URL from API if available (already includes cache busting from backend)
    if (imageUrl) {
      // If imageUrl is relative, convert to absolute for export
      if (imageUrl.startsWith('/')) {
        const absoluteUrl = window.location.origin + imageUrl;
        console.log('BillExport - Converted relative URL to absolute:', absoluteUrl);
        return absoluteUrl;
      }
      console.log('BillExport - Using imageUrl:', imageUrl);
      return imageUrl;
    }
    if (!imagePath) {
      console.log('BillExport - No imagePath provided');
      return null;
    }
    // Ensure proper URL format
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const relativeUrl = `/storage/${cleanPath}`;
    // Convert to absolute URL for export
    const absoluteUrl = window.location.origin + relativeUrl;
    console.log('BillExport - Generated absolute URL from path:', absoluteUrl);
    return absoluteUrl;
  };

  // Helper function to render bill content
  const renderBillContent = (billData, showTitle = true) => (
    <div>
      {showTitle && (
        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold mb-2">PHIẾU THU BADMINTON</h1>
          <p className="text-lg">Bill #{billData.id} - Ngày: {formatDate(billData.date)}</p>
        </div>
      )}

      {/* Bill Info */}
      <div className="mb-6 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <div className="text-sm text-gray-600 mb-1">Tổng tiền sân</div>
          <div className="text-lg font-semibold">{formatCurrencyRounded(billData.court_total)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Tổng tiền cầu</div>
          <div className="text-lg font-semibold">{formatCurrencyRounded(billData.total_shuttle_price)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Tổng tiền</div>
          <div className="text-xl font-bold text-blue-600">{formatCurrencyRounded(billData.total_amount)}</div>
        </div>
      </div>

      {/* Shuttles */}
      {billData.bill_shuttles && billData.bill_shuttles.length > 0 && (
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
              {billData.bill_shuttles.map((shuttle, index) => (
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
            {billData.bill_players?.map((player, index) => (
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
                  billData.bill_players?.reduce((sum, p) => sum + p.total_amount, 0) || 0
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note */}
      {billData.note && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm font-semibold mb-1">Ghi chú:</div>
          <div className="text-sm">{billData.note}</div>
        </div>
      )}
    </div>
  );

  // Render payment accounts section
  const renderPaymentAccounts = () => {
    if (activeAccounts.length === 0) return null;
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">THÔNG TIN THANH TOÁN</h3>
        <div className="space-y-4">
          {activeAccounts.map((account) => {
            const base64Image = paymentAccountImages[account.id];
            const imageUrl = account.qr_code_image_url || 
              (account.qr_code_image ? `${window.location.origin}/storage/${account.qr_code_image}` : null);
            const imageSrc = base64Image || imageUrl;
            
            return (
              <div key={account.id} className="text-center p-4 bg-gray-50 rounded-lg border">
                <div className="mb-2">
                  <div className="font-semibold text-lg">{account.bank_name}</div>
                  <div className="text-sm text-gray-600">{account.account_holder_name}</div>
                  <div className="text-sm font-mono font-semibold">{account.account_number}</div>
                </div>
                {account.qr_code_image && imageSrc && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={imageSrc}
                      alt="QR Code"
                      className="w-40 h-40 object-contain border-2 border-gray-300 rounded bill-export-image"
                      crossOrigin={base64Image ? undefined : "anonymous"}
                      loading="eager"
                    />
                  </div>
                )}
                {account.note && (
                  <div className="mt-2 text-xs text-gray-600 italic">{account.note}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Check if bill has sub_bills
  const hasSubBills = bill.sub_bills && bill.sub_bills.length > 0;

  // Layout khi có bill phụ: Bill chính trái, Bill phụ phải, QR dưới bill phụ
  if (hasSubBills) {
    return (
      <div id="bill-export" className="bg-white p-6 max-w-6xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="grid grid-cols-2 gap-6">
          {/* Cột trái: Bill chính */}
          <div className="col-span-1">
            {renderBillContent(bill, true)}
          </div>

          {/* Cột phải: Bill phụ và QR thanh toán */}
          <div className="col-span-1">
            <div className="border-l-2 border-gray-800 pl-6">
              {/* Bill phụ */}
              {bill.sub_bills.map((subBill) => (
                <div key={subBill.id} className="mb-6">
                  <div className="text-center mb-4 border-b-2 border-gray-600 pb-2">
                    <h2 className="text-2xl font-bold mb-1">
                      Bill con #{subBill.id}{subBill.note ? ` - ${subBill.note}` : ''}
                    </h2>
                    <p className="text-sm text-gray-600">Ngày: {formatDate(subBill.date)}</p>
                  </div>
                  {renderBillContent(subBill, false)}
                </div>
              ))}

              {/* QR thanh toán dưới bill phụ */}
              {activeAccounts.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-gray-600">
                  {renderPaymentAccounts()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout khi không có bill phụ: Bill trái, QR phải (như hiện tại)
  return (
    <div id="bill-export" className="bg-white p-6 max-w-6xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="grid grid-cols-3 gap-6">
        {/* Cột trái: Nội dung phiếu thu */}
        <div className="col-span-2">
          {renderBillContent(bill, true)}
        </div>

        {/* Cột phải: Thông tin thanh toán */}
        {activeAccounts.length > 0 && (
          <div className="col-span-1">
            <div className="border-l-2 border-gray-800 pl-6">
              {renderPaymentAccounts()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

