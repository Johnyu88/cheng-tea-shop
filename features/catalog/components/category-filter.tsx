"use client";

import type { TeaCategory } from "@/lib/domain";
import { storefrontCategoryOptions } from "@/lib/domain/tea-categories";

type CategoryFilterProps = {
  value: TeaCategory | undefined;
  onChange: (value: TeaCategory | undefined) => void;
};

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="category-filter" aria-label="茶類分類">
      <div className="category-filter-row" role="group" aria-label="茶類分類">
        {storefrontCategoryOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            className="filter-button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <details className="category-filter-fallback">
        <summary>改用下拉選單</summary>
        <label>
          <span className="sr-only">選擇茶類</span>
          <select value={value ?? ""} onChange={(event) => onChange((event.target.value || undefined) as TeaCategory | undefined)}>
            {storefrontCategoryOptions.map((option) => (
              <option key={option.label} value={option.value ?? ""}>{option.label}</option>
            ))}
          </select>
        </label>
      </details>
    </div>
  );
}
