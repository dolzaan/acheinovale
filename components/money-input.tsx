"use client";

import { useState, type KeyboardEvent } from "react";

const MAX_PRICE_CENTS = 2_000_000_000;
const brlNumberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCents(digits: string) {
  if (!digits) return "";
  return brlNumberFormatter.format(Number(digits) / 100);
}

export function MoneyInput({ name = "price" }: { name?: string }) {
  const [digits, setDigits] = useState("");

  function updateValue(value: string) {
    const nextDigits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (!nextDigits) {
      setDigits("");
      return;
    }

    setDigits(String(Math.min(Number(nextDigits), MAX_PRICE_CENTS)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    event.preventDefault();

    const input = event.currentTarget;
    const selectedEverything = input.selectionStart === 0 && input.selectionEnd === input.value.length;
    setDigits((current) => selectedEverything ? "" : current.slice(0, -1));
  }

  return (
    <div className="listing-money-input">
      <span aria-hidden="true">R$</span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        value={formatCents(digits)}
        required
        aria-label="Preço do imóvel"
        onChange={(event) => updateValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
