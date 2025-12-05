import { useState, useEffect } from 'react';
import { playersApi } from '../../services/api';
import { formatCurrency, formatRatio } from '../../utils/formatters';
import CurrencyInput from '../../components/common/CurrencyInput';
import NumberInput from '../../components/common/NumberInput';

export default function PlayersManagement() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [filters, setFilters] = useState({ search: '', gender: '', has_debt: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: '',
    default_ratio: '',
    phone: '',
  });

  useEffect(() => {
    loadPlayers();
  }, [filters]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.gender) params.gender = filters.gender;
      if (filters.has_debt) params.has_debt = filters.has_debt === 'true';

      const response = await playersApi.getAll(params);
      setPlayers(response.data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      email: player.email,
      gender: player.gender || '',
      default_ratio: player.default_ratio || '',
      phone: player.phone || '',
      password: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      if (editingPlayer) {
        await playersApi.update(editingPlayer.id, payload);
      } else {
        await playersApi.create(payload);
      }
      setShowForm(false);
      setEditingPlayer(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        gender: '',
        default_ratio: '',
        phone: '',
      });
      loadPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa người chơi này?')) return;
    try {
      await playersApi.delete(id);
      loadPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý Người chơi</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPlayer(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              gender: '',
              default_ratio: '',
              phone: '',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Thêm người chơi
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm tên..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
          <select
            value={filters.has_debt}
            onChange={(e) => setFilters({ ...filters, has_debt: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tất cả</option>
            <option value="true">Có nợ</option>
            <option value="false">Không nợ</option>
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingPlayer ? 'Sửa người chơi' : 'Thêm người chơi'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {!editingPlayer && (
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mức tính mặc định</label>
                <NumberInput
                  value={formData.default_ratio}
                  onChange={(value) => setFormData({ ...formData, default_ratio: value })}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlayer(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giới tính
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mức tính
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nợ hiện tại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{player.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.gender === 'male' ? 'Nam' : player.gender === 'female' ? 'Nữ' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.default_ratio ? formatRatio(player.default_ratio) : 'Mặc định'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(player.current_debt_amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(player)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

