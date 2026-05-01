import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/** Free-text tags input (Enter / comma to confirm). */
export function TagsInput({ value, onChange, suggestions = [], placeholder = "Adicionar tag..." }: Props) {
  const [text, setText] = useState("");

  function add(raw: string) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setText("");
  }

  function remove(t: string) {
    onChange(value.filter((x) => x !== t));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const filteredSuggestions = suggestions.filter((s) => !value.includes(s) && s.includes(text.toLowerCase())).slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 font-normal">
            {t}
            <button onClick={() => remove(t)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => text && add(text)}
        placeholder={placeholder}
      />
      {filteredSuggestions.length > 0 && text && (
        <div className="flex flex-wrap gap-1">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border/60"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
