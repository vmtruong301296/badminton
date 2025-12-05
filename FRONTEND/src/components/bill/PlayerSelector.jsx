import { useState, useEffect } from 'react';
import { playersApi } from '../../services/api';
import { formatRatio, formatCurrency } from '../../utils/formatters';

export default function PlayerSelector({ selectedPlayers, onSelect, onRemove }) {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await playersApi.getAll();
      setPlayers(response.data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const isSelected = selectedPlayers.some((sp) => sp.user_id === p.id);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return !isSelected && matchesSearch;
  });

  const handleSelect = (player) => {
    onSelect({
      user_id: player.id,
      name: player.name,
      ratio_value: player.default_ratio_value || 1.0,
      default_ratio_value: player.default_ratio_value || 1.0,
      debt_amount: player.current_debt_amount || 0,
      debt_date: player.debt_date,
      include_debt: false,
      menus: [],
    });
    setSearch('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cột trái: Danh sách người chơi để chọn */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-3 text-gray-700">Danh sách người chơi</h4>
        <input
          type="text"
          placeholder="Tìm kiếm người chơi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 bg-white"
        />
        {loading ? (
          <div className="text-center py-4">Đang tải...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {search ? 'Không tìm thấy' : 'Không còn người chơi nào'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleSelect(player)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors bg-white"
                  >
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="inline-block mr-3">
                        Mức tính: <span className="font-semibold">{formatRatio(player.default_ratio_value || 1.0)}</span>
                      </span>
                      {player.current_debt_amount > 0 && (
                        <span className="text-red-600">
                          Nợ: {formatCurrency(player.current_debt_amount)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cột phải: Danh sách đã chọn */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-semibold mb-3 text-gray-700">
          Đã chọn ({selectedPlayers.length})
        </h4>
        {selectedPlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa chọn người chơi nào
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {selectedPlayers.map((player, index) => (
              <div
                key={player.user_id || index}
                className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      <div>
                        Mức tính: <span className="font-medium">{formatRatio(player.ratio_value ?? player.default_ratio_value ?? 1.0)}</span>
                      </div>
                      {player.debt_amount > 0 && player.include_debt && (
                        <div className="text-red-600">
                          Nợ: {formatCurrency(player.debt_amount)}
                        </div>
                      )}
                      {player.menus && player.menus.length > 0 && (
                        <div className="text-green-600">
                          Menu: {player.menus.length} món
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                    title="Xóa"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
