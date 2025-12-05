import { useState, useEffect } from 'react';
import { menusApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import CurrencyInput from '../../components/common/CurrencyInput';

export default function MenusManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await menusApi.getAll();
      setMenus(response.data);
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({ name: menu.name, price: menu.price });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await menusApi.update(editingMenu.id, formData);
      } else {
        await menusApi.create(formData);
      }
      setShowForm(false);
      setEditingMenu(null);
      setFormData({ name: '', price: 0 });
      loadMenus();
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    try {
      await menusApi.delete(id);
      loadMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý Menu nước</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingMenu(null);
            setFormData({ name: '', price: 0 });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Thêm menu
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingMenu ? 'Sửa menu' : 'Thêm menu'}
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
                <label className="block text-sm font-medium mb-1">Giá (VND) *</label>
                <CurrencyInput
                  value={formData.price}
                  onChange={(value) => setFormData({ ...formData, price: value })}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMenu(null);
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
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menus.map((menu) => (
                <tr key={menu.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{menu.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(menu.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(menu)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
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

