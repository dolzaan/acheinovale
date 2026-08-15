"use client";

import Form from "next/form";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "./icons";
import { PendingSubmitButton } from "./pending-submit-button";

export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="header-search" ref={containerRef}>
      <button
        className="header-search__trigger"
        type="button"
        aria-label={isOpen ? "Fechar pesquisa" : "Pesquisar"}
        aria-expanded={isOpen}
        aria-controls="header-search-panel"
        onClick={() => setIsOpen(current => !current)}
      >
        <SearchIcon size={20} />
      </button>

      {isOpen ? (
        <div className="header-search__panel" id="header-search-panel">
          <Form className="header-search__form" action="/buscar" role="search">
            <SearchIcon size={20} />
            <input
              ref={inputRef}
              name="q"
              type="search"
              maxLength={80}
              placeholder="Ex: casa para alugar no Centro"
              aria-label="Pesquisar no AcheiNoVale"
              required
            />
            <PendingSubmitButton
              className="header-search__submit"
              pendingText="Buscando..."
              navigation
            >
              Buscar
            </PendingSubmitButton>
          </Form>
          <small>Pesquise imóveis por bairro, tipo ou característica.</small>
        </div>
      ) : null}
    </div>
  );
}
