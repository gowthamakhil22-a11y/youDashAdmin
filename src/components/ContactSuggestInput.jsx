import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

/**
 * Text input that fetches H2H contact suggestions (name+phone) as the user types.
 * When a suggestion is picked, both name and phone are filled via onSelect.
 *
 * Props:
 *  value        – controlled value for this field
 *  onChange     – (value: string) => void
 *  onSelect     – ({ name, phone }) => void  — called when a suggestion is chosen
 *  type         – "sender" | "receiver"
 *  placeholder  – optional
 *  className    – extra class on the input
 *  suppressRef  – shared React ref between paired fields (name + phone); when one
 *                 field picks a contact, it sets suppressRef.current = true so the
 *                 sibling field skips the fetch triggered by the auto-fill.
 */
export default function ContactSuggestInput({ value, onChange, onSelect, type = "sender", placeholder, className = "", suppressRef }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const justPickedRef = useRef(false);

  useEffect(() => {
    const q = (value || "").trim();
    clearTimeout(debounceRef.current);

    // Skip fetch if this field itself just picked a suggestion
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }

    // Skip fetch if the sibling field (name ↔ phone) just auto-filled this value
    if (suppressRef?.current) {
      suppressRef.current = false;
      setOpen(false);
      setSuggestions([]);
      return;
    }

    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/orders/hub-to-hub/contacts`, {
          params: { q, type },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setSuggestions(list);
        setOpen(list.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [value, type]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(contact) {
    justPickedRef.current = true;
    if (suppressRef) suppressRef.current = true;
    onSelect(contact);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        className={`input w-full ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-52 overflow-y-auto text-[13px]">
          {suggestions.map((c, i) => (
            <li
              key={`${c.name}-${c.phone}`}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer gap-3 ${i === activeIndex ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="font-medium truncate">{c.name}</span>
              <span className="text-zinc-400 shrink-0">{c.phone}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
