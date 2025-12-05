import { formatCurrency, formatCurrencyRounded, formatRatio } from '../../utils/formatters';

export default function BillSummary({ preview }) {
  if (!preview) return null;

  return (
    <div className="bg-white border rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-bold mb-4">Tóm tắt Bill</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Tổng tiền sân:</span>
          <span className="font-medium">{formatCurrencyRounded(preview.court_total || 0)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Tổng tiền cầu:</span>
          <span className="font-medium">{formatCurrencyRounded(preview.total_shuttle_price || 0)}</span>
        </div>
        
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Tổng tiền:</span>
          <span className="font-bold text-lg">{formatCurrencyRounded(preview.total_amount || 0)}</span>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Thông tin tính toán:</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tổng mức tính:</span>
              <span>{formatRatio(preview.sum_ratios || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Unit price:</span>
              <span>{formatCurrencyRounded(Math.round(preview.unit_price || 0))}</span>
            </div>
          </div>
        </div>

        {Math.abs(preview.rounding_difference || 0) > 1 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
              ⚠️ Chênh lệch làm tròn: {formatCurrency(Math.abs(preview.rounding_difference))}
              <div className="text-xs mt-1">
                (Sẽ được xử lý bởi backend khi tạo bill)
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium mb-2">Chi tiết từng người:</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {preview.players?.map((player, index) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                <div className="font-medium">{player.name}</div>
                <div className="text-xs text-gray-600 space-y-1 mt-1">
                  <div>Share: {formatCurrencyRounded(player.share_amount || 0)}</div>
                  {player.menu_extra_total > 0 && (
                    <div>Menu: {formatCurrencyRounded(player.menu_extra_total)}</div>
                  )}
                  {player.debt_amount > 0 && (
                    <div>Nợ: {formatCurrencyRounded(player.debt_amount)}</div>
                  )}
                  <div className="font-semibold pt-1 border-t">
                    Tổng: {formatCurrencyRounded(player.total_amount || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

