import { useState, useEffect } from 'react';
import { ratiosApi } from '../../services/api';
import { formatRatio } from '../../utils/formatters';
import NumberInput from '../../components/common/NumberInput';

export default function RatiosManagement() {
  const [ratios, setRatios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRatio, setEditingRatio] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    value: 1.0,
    is_default: false,
  });

  useEffect(() => {
    loadRatios();
  }, []);

  const loadRatios = async () => {
    try {
      setLoading(true);
      const response = await ratiosApi.getAll();
      setRatios(response.data);
    } catch (error) {
      console.error('Error loading ratios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ratio) => {
    setEditingRatio(ratio);
    setFormData({
      name: ratio.name,
      gender: ratio.gender || '',
      value: ratio.value,
      is_default: ratio.is_default || false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRatio) {
        await ratiosApi.update(editingRatio.id, formData);
      } else {
        await ratiosApi.create(formData);
      }
      setShowForm(false);
      setEditingRatio(null);
      setFormData({ name: '', gender: '', value: 1.0, is_default: false });
      loadRatios();
    } catch (error) {
      console.error('Error saving ratio:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    try {
      await ratiosApi.delete(id);
      loadRatios();
    } catch (error) {
      console.error('Error deleting ratio:', error);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold">Quản lý Mức tính</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingRatio(null);
            setFormData({ name: '', gender: '', value: 1.0, is_default: false });
          }}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base whitespace-nowrap"
        >
          + Thêm mức tính
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingRatio ? 'Sửa mức tính' : 'Thêm mức tính'}
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
                <label className="block text-sm font-medium mb-1">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Chung</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá trị *</label>
                <NumberInput
                  value={formData.value}
                  onChange={(value) => setFormData({ ...formData, value })}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="mr-2"
                  />
                  <span>Mặc định cho giới tính</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRatio(null);
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

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
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
                    Giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mặc định
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratios.map((ratio) => (
                  <tr key={ratio.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{ratio.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ratio.gender === 'male' ? 'Nam' : ratio.gender === 'female' ? 'Nữ' : 'Chung'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatRatio(ratio.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ratio.is_default ? '✓' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(ratio)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(ratio.id)}
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {ratios.map((ratio) => (
              <div key={ratio.id} className="bg-white shadow rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ratio.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {ratio.gender === 'male' ? 'Nam' : ratio.gender === 'female' ? 'Nữ' : 'Chung'}
                    </p>
                  </div>
                  {ratio.is_default && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Mặc định
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  Giá trị: <span className="font-medium">{formatRatio(ratio.value)}</span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(ratio)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(ratio.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

