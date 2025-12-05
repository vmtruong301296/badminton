import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billsApi, playersApi, shuttlesApi } from '../../services/api';
import { calculateBillPreview, formatCurrency, formatRatio } from '../../utils/formatters';
import CurrencyInput from '../../components/common/CurrencyInput';
import NumberInput from '../../components/common/NumberInput';
import DatePicker from '../../components/common/DatePicker';
import PlayerSelector from '../../components/bill/PlayerSelector';
import ShuttleRow from '../../components/bill/ShuttleRow';
import MenuItemPicker from '../../components/bill/MenuItemPicker';
import BillSummary from '../../components/bill/BillSummary';

export default function CreateBill() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shuttleTypes, setShuttleTypes] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
    court_total: 0,
    shuttles: [],
    players: [],
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadShuttleTypes();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [formData]);

  const loadShuttleTypes = async () => {
    try {
      const response = await shuttlesApi.getAll();
      setShuttleTypes(response.data);
      
      // Tự động thêm cầu S70 với số lượng 12
      const s70Shuttle = response.data.find((st) => st.name === 'Cầu S70');
      if (s70Shuttle) {
        setFormData((prev) => ({
          ...prev,
          shuttles: [
            {
              shuttle_type_id: s70Shuttle.id,
              quantity: 12,
              price: s70Shuttle.price,
            },
          ],
        }));
      }
    } catch (error) {
      console.error('Error loading shuttle types:', error);
    }
  };

  const updatePreview = () => {
    // Chỉ cần players để hiển thị preview, shuttles đã có mặc định
    if (formData.players.length === 0) {
      setPreview(null);
      return;
    }

    const previewData = calculateBillPreview(
      formData.court_total,
      formData.shuttles
        .filter((s) => s.shuttle_type_id)
        .map((s) => {
          const type = shuttleTypes.find((st) => st.id === s.shuttle_type_id);
          return {
            price: type?.price || 0,
            quantity: s.quantity || 1,
          };
        }),
      formData.players.map((p) => ({
        ...p,
        ratio_value: p.ratio_value ?? p.default_ratio_value ?? 1.0,
        menus: p.menus || [],
        debt_amount: p.include_debt ? (p.debt_amount || 0) : 0,
      }))
    );
    setPreview({
      ...previewData,
      court_total: formData.court_total,
    });
  };

  const handleAddShuttle = () => {
    setFormData({
      ...formData,
      shuttles: [
        ...formData.shuttles,
        { shuttle_type_id: null, quantity: 1, price: 0 },
      ],
    });
  };

  const handleUpdateShuttle = (index, updated) => {
    const newShuttles = [...formData.shuttles];
    newShuttles[index] = updated;
    setFormData({ ...formData, shuttles: newShuttles });
  };

  const handleRemoveShuttle = (index) => {
    setFormData({
      ...formData,
      shuttles: formData.shuttles.filter((_, i) => i !== index),
    });
  };

  const handleSelectPlayer = (player) => {
    setFormData({
      ...formData,
      players: [...formData.players, player],
    });
  };

  const handleRemovePlayer = (index) => {
    setFormData({
      ...formData,
      players: formData.players.filter((_, i) => i !== index),
    });
  };

  const handleUpdatePlayer = (index, updated) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = updated;
    setFormData({ ...formData, players: newPlayers });
  };

  const handleLoadPlayerDebt = async (playerIndex) => {
    const player = formData.players[playerIndex];
    try {
      const response = await playersApi.getDebts(player.user_id);
      const totalDebt = response.data.total_debt || 0;
      const latestDebt = response.data.debts?.[0];
      
      handleUpdatePlayer(playerIndex, {
        ...player,
        debt_amount: totalDebt,
        debt_date: latestDebt?.debt_date,
      });
    } catch (error) {
      console.error('Error loading player debt:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.players.length === 0) {
      alert('Vui lòng chọn ít nhất một người chơi');
      return;
    }

    // Kiểm tra shuttles (đã có mặc định nên thường sẽ có)
    const validShuttles = formData.shuttles.filter((s) => s.shuttle_type_id);
    if (validShuttles.length === 0) {
      alert('Vui lòng thêm ít nhất một loại cầu hợp lệ');
      return;
    }

    const sumRatios = formData.players.reduce((sum, p) => {
      const ratio = p.ratio_value ?? p.default_ratio_value ?? 1.0;
      return sum + ratio;
    }, 0);
    if (sumRatios === 0) {
      alert('Tổng mức tính phải lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        date: formData.date,
        note: formData.note || null,
        court_total: formData.court_total,
        shuttles: formData.shuttles
          .filter((s) => s.shuttle_type_id)
          .map((s) => ({
            shuttle_type_id: s.shuttle_type_id,
            quantity: s.quantity || 1,
          })),
        players: formData.players.map((p) => ({
          user_id: p.user_id,
          ratio_value: p.ratio_value || null,
          menus: (p.menus || []).map((m) => ({
            menu_id: m.menu_id,
            quantity: m.quantity,
          })),
        })),
      };

      const response = await billsApi.create(payload);
      navigate(`/bills/${response.data.id}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Có lỗi xảy ra khi tạo bill: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Tạo Bill mới</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày đánh *
                  </label>
                  <DatePicker
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng tiền sân (VND) *
                  </label>
                  <CurrencyInput
                    value={formData.court_total}
                    onChange={(value) => setFormData({ ...formData, court_total: value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Shuttles */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Loại cầu</h3>
                <button
                  type="button"
                  onClick={handleAddShuttle}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  + Thêm cầu
                </button>
              </div>
              <div className="space-y-4">
                {formData.shuttles.map((shuttle, index) => (
                  <ShuttleRow
                    key={index}
                    shuttle={shuttle}
                    onUpdate={(updated) => handleUpdateShuttle(index, updated)}
                    onRemove={() => handleRemoveShuttle(index)}
                  />
                ))}
              </div>
            </div>

            {/* Players */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Người chơi</h3>
              
              {/* Phần chọn người chơi - 2 cột */}
              <div className="mb-6">
                <PlayerSelector
                  selectedPlayers={formData.players}
                  onSelect={handleSelectPlayer}
                  onRemove={handleRemovePlayer}
                />
              </div>

              {/* Phần chi tiết từng người chơi đã chọn */}
              {formData.players.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-md font-semibold mb-4 text-gray-700">
                    Chi tiết người chơi ({formData.players.length})
                  </h4>
                  <div className="space-y-4">
                    {formData.players.map((player, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{player.name}</h4>
                            <button
                              type="button"
                              onClick={() => handleLoadPlayerDebt(index)}
                              className="text-sm text-blue-600 hover:underline mt-1"
                            >
                              🔄 Tải lại nợ
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mức tính (override)
                            </label>
                            <NumberInput
                              value={player.ratio_value ?? player.default_ratio_value ?? 1.0}
                              onChange={(value) =>
                                handleUpdatePlayer(index, { ...player, ratio_value: value })
                              }
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Mặc định: {formatRatio(player.default_ratio_value ?? 1.0)}
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                checked={player.include_debt || false}
                                onChange={(e) =>
                                  handleUpdatePlayer(index, {
                                    ...player,
                                    include_debt: e.target.checked,
                                  })
                                }
                                className="mr-2"
                              />
                              <span className="text-sm font-medium">Bao gồm nợ cũ</span>
                            </label>
                            {player.include_debt && player.debt_amount > 0 && (
                              <div className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                                <span className="font-medium">Nợ hiện tại:</span> {formatCurrency(player.debt_amount)}
                                {player.debt_date && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Ngày nợ: {player.debt_date}
                                  </div>
                                )}
                              </div>
                            )}
                            {!player.include_debt && player.debt_amount > 0 && (
                              <div className="text-xs text-gray-500">
                                Có nợ: {formatCurrency(player.debt_amount)} (chưa chọn bao gồm)
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Menu nước
                          </label>
                          <MenuItemPicker
                            player={player}
                            onUpdate={(updated) => handleUpdatePlayer(index, updated)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo Bill'}
              </button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <BillSummary preview={preview} />
          </div>
        </div>
      </form>
    </div>
  );
}

