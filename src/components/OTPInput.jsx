import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

const OTPInput = ({ 
  length = 6, 
  onComplete, 
  onValueChange,
  disabled = false,
  error = false,
  className = ""
}) => {
  const [values, setValues] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  useEffect(() => {
    // Call onValueChange when values change
    if (onValueChange) {
      onValueChange(values.join(''));
    }

    // Call onComplete when all fields are filled
    if (onComplete && values.every(value => value !== '')) {
      onComplete(values.join(''));
    }
  }, [values, onComplete, onValueChange]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // If current field is empty, move to previous field and clear it
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current field
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (digits.length > 0) {
      const newValues = new Array(length).fill('');
      for (let i = 0; i < digits.length; i++) {
        newValues[i] = digits[i];
      }
      setValues(newValues);
      
      // Focus the next empty field or the last field
      const nextIndex = Math.min(digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const clearAll = () => {
    setValues(new Array(length).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex gap-2 justify-center">
        {values.map((value, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-12 text-center text-lg font-bold
              bg-slate-950/50 border-slate-800 text-white 
              focus:border-indigo-500 focus:ring-indigo-500/20 
              rounded-xl transition-all
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600'}
            `}
            autoComplete="off"
          />
        ))}
      </div>
      
      {/* Clear button */}
      <button
        type="button"
        onClick={clearAll}
        disabled={disabled || values.every(v => v === '')}
        className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Clear all
      </button>
    </div>
  );
};

export default OTPInput;