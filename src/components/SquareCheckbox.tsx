'use client';

import React from 'react';

interface SquareCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  size?: 'sm' | 'md';
}

/**
 * 인쇄물 및 웹 화면 모두에서 선명하게 보이는 정사각형 체크박스 컴포넌트
 */
export function SquareCheckbox({
  checked,
  onChange,
  label,
  size = 'md',
}: SquareCheckboxProps) {
  const boxSize = size === 'sm' ? 'w-3.5 h-3.5 text-[10px]' : 'w-4 h-4 text-[11px]';

  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onChange(); }}
      aria-pressed={checked}
      aria-label={label || '체크박스'}
      className={`inline-flex items-center justify-center border border-slate-600 rounded-[2px] transition-colors select-none cursor-pointer ${boxSize} ${
        checked
          ? 'bg-slate-800 text-white border-slate-900 font-bold'
          : 'bg-white hover:bg-slate-100 text-transparent'
      }`}
    >
      {checked ? '✓' : ''}
    </button>
  );
}
