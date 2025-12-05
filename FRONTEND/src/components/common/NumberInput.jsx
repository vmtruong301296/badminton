export default function NumberInput({ value, onChange, min, max, step = 1, placeholder = '', className = '', ...props }) {
  const handleChange = (e) => {
    const numValue = parseFloat(e.target.value) || 0;
    let finalValue = numValue;
    
    if (min !== undefined && numValue < min) finalValue = min;
    if (max !== undefined && numValue > max) finalValue = max;
    
    onChange?.(finalValue);
  };

  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

