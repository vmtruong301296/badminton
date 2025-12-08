import { useState, useEffect } from 'react';
import { paymentAccountsApi } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function PaymentAccountsManagement() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, accountId: null });
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    qr_code_image: null, // Will store base64 string
    is_active: true,
    note: '',
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await paymentAccountsApi.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading payment accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bank_name: account.bank_name || '',
        account_number: account.account_number || '',
        account_holder_name: account.account_holder_name || '',
        qr_code_image: account.qr_code_image || null, // base64 string from database
        is_active: account.is_active ?? true,
        note: account.note || '',
      });
      setPreviewImage(account.qr_code_image || null);
    } else {
      setEditingAccount(null);
      setFormData({
        bank_name: '',
        account_number: '',
        account_holder_name: '',
        qr_code_image: null,
        is_active: true,
        note: '',
      });
      setPreviewImage(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({
      bank_name: '',
      account_number: '',
      account_holder_name: '',
      qr_code_image: null,
      is_active: true,
      note: '',
    });
    setPreviewImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result; // This is already base64 data URL
        setFormData({ ...formData, qr_code_image: base64String });
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data with proper boolean conversion
      const submitData = {
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_holder_name: formData.account_holder_name,
        is_active: formData.is_active === true || formData.is_active === 'true' || formData.is_active === 1,
        note: formData.note,
        qr_code_image: formData.qr_code_image || null, // base64 string or null
      };
      
      if (editingAccount) {
        await paymentAccountsApi.update(editingAccount.id, submitData);
        handleCloseModal();
        await loadAccounts();
      } else {
        await paymentAccountsApi.create(submitData);
        handleCloseModal();
        await loadAccounts();
      }
    } catch (error) {
      console.error('Error saving payment account:', error);
      alert('Có lỗi xảy ra khi lưu tài khoản: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteClick = (accountId) => {
    setDeleteConfirm({ isOpen: true, accountId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await paymentAccountsApi.delete(deleteConfirm.accountId);
      setDeleteConfirm({ isOpen: false, accountId: null });
      loadAccounts();
    } catch (error) {
      console.error('Error deleting payment account:', error);
      alert('Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, accountId: null });
  };

  // No longer needed - images are now base64 strings directly from database

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-row justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Tài khoản Nhận tiền</h2>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base whitespace-nowrap"
        >
          ➕ Thêm tài khoản
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có tài khoản nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-lg shadow p-4 sm:p-6 border-2 ${
                account.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{account.bank_name}</h3>
                  <p className="text-sm text-gray-600">{account.account_holder_name}</p>
                  <p className="text-sm font-mono text-gray-700">{account.account_number}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    account.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {account.is_active ? 'Đang dùng' : 'Tạm khóa'}
                </span>
              </div>

              {account.qr_code_image && (
                <div className="mb-4">
                  <img
                    src={account.qr_code_image}
                    alt="QR Code"
                    className="w-full h-auto border rounded-lg"
                    onError={(e) => {
                      console.error('Error loading image');
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {account.note && (
                <p className="text-sm text-gray-600 mb-4 italic">{account.note}</p>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenModal(account)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(account.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên ngân hàng *
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tài khoản *
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chủ tài khoản *
                  </label>
                  <input
                    type="text"
                    value={formData.account_holder_name}
                    onChange={(e) =>
                      setFormData({ ...formData, account_holder_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh QR Code
                  </label>
                  <input
                    key={editingAccount ? `file-${editingAccount.id}-${editingAccount.updated_at || Date.now()}` : 'file-new'}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <img
                        key={previewImage}
                        src={previewImage}
                        alt="QR Code Preview"
                        className="w-48 h-48 object-contain border rounded-lg"
                        onError={() => {
                          console.error('Error loading preview image:', previewImage);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Đang sử dụng</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingAccount ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác."
      />
    </div>
  );
}

