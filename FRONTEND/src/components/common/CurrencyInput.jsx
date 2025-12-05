import { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onChange, placeholder = '0', className = '' }) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatNumber(value));
    }
  }, [value]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const handleChange = (e) => {
    const input = e.target.value.replace(/[^\d]/g, '');
    const numValue = parseInt(input) || 0;
    setDisplayValue(formatNumber(numValue));
    onChange?.(numValue);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}

