"use client";

import { useState } from "react";
import { formatBrazilianPhone } from "@/lib/validation/profile";

type PhoneInputProps = {
  defaultValue?: string;
  name?: string;
};

export function PhoneInput({ defaultValue = "", name = "phone" }: PhoneInputProps) {
  const [value, setValue] = useState(formatBrazilianPhone(defaultValue));

  return (
    <input
      id={name}
      name={name}
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
