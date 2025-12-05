export default function DatePicker({ value, onChange, className = '', ...props }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

