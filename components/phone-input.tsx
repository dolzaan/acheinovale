"use client";

import { useState } from "react";
import { formatBrazilianPhone } from "@/lib/validation/profile";

export function PhoneInput({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(formatBrazilianPhone(defaultValue));

  return (
    <input
      id="phone"
      name="phone"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(47) 99999-9999"
      value={value}
      maxLength={15}
      required
      onChange={(event) => setValue(formatBrazilianPhone(event.target.value))}
    />
  );
}
