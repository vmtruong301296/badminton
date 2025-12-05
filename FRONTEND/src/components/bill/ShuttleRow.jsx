import { useState, useEffect } from 'react';
import { shuttlesApi } from '../../services/api';
import NumberInput from '../common/NumberInput';
import { formatCurrency } from '../../utils/formatters';

export default function ShuttleRow({ shuttle, onUpdate, onRemove }) {
  const [shuttleTypes, setShuttleTypes] = useState([]);

  useEffect(() => {
    loadShuttleTypes();
  }, []);

  const loadShuttleTypes = async () => {
    try {
      const response = await shuttlesApi.getAll();
      setShuttleTypes(response.data);
    } catch (error) {
      console.error('Error loading shuttle types:', error);
    }
  };

  const selectedType = shuttleTypes.find((st) => st.id === shuttle.shuttle_type_id);

  const handleTypeChange = (e) => {
    const typeId = parseInt(e.target.value);
    const type = shuttleTypes.find((st) => st.id === typeId);
    onUpdate({
      ...shuttle,
      shuttle_type_id: typeId,
      price: type?.price || 0,
    });
  };

  const handleQuantityChange = (qty) => {
    onUpdate({
      ...shuttle,
      quantity: qty,
    });
  };

  const subtotal = (selectedType?.price || 0) * shuttle.quantity;

  return (
    <div className="grid grid-cols-12 gap-4 items-end">
      <div className="col-span-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Loại cầu
        </label>
        <select
          value={shuttle.shuttle_type_id || ''}
          onChange={handleTypeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Chọn loại cầu</option>
          {shuttleTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} - {formatCurrency(type.price)}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số lượng
        </label>
        <NumberInput
          value={shuttle.quantity}
          onChange={handleQuantityChange}
          min={1}
          className="w-full"
        />
      </div>
      <div className="col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Thành tiền
        </label>
        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
          {formatCurrency(subtotal)}
        </div>
      </div>
      <div className="col-span-1">
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

