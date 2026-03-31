import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500",
  "bg-pink-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500",
  "bg-indigo-500", "bg-teal-500",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AssigneeAvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function AssigneeAvatar({ name, size = "md", className }: AssigneeAvatarProps) {
  const sizeClass = size === "sm" ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]";
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0",
        getColor(name), sizeClass, className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

interface AssigneeAvatarGroupProps {
  names: string[];
  max?: number;
  size?: "sm" | "md";
}

export function AssigneeAvatarGroup({ names, max = 3, size = "sm" }: AssigneeAvatarGroupProps) {
  if (names.length === 0) return null;
  const visible = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map(name => (
        <AssigneeAvatar key={name} name={name} size={size} className="ring-1 ring-background" />
      ))}
      {remaining > 0 && (
        <div className={cn(
          "rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium ring-1 ring-background",
          size === "sm" ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]"
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}

interface MultiAssigneeInputProps {
  value: string[];
  onChange: (names: string[]) => void;
}

export function MultiAssigneeInput({ value, onChange }: MultiAssigneeInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addName = () => {
    const name = inputValue.trim();
    if (name && !value.includes(name)) {
      onChange([...value, name]);
    }
    setInputValue("");
  };

  const removeName = (name: string) => {
    onChange(value.filter(n => n !== name));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map(name => (
          <div key={name} className="flex items-center gap-1 bg-muted rounded-full pl-1 pr-2 py-0.5">
            <AssigneeAvatar name={name} size="sm" />
            <span className="text-xs">{name}</span>
            <button onClick={() => removeName(name)} className="text-muted-foreground hover:text-destructive ml-0.5">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Adicionar responsável..."
          className="flex-1 h-8 text-sm"
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); addName(); }
          }}
        />
        <button
          onClick={addName}
          className="h-8 w-8 flex items-center justify-center rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Parse comma/semicolon separated assignee_name into array */
export function parseAssignees(assigneeName: string | null): string[] {
  if (!assigneeName) return [];
  return assigneeName.split(/[,;]/).map(n => n.trim()).filter(Boolean);
}

/** Join array back to comma-separated string for DB */
export function joinAssignees(names: string[]): string {
  return names.join(", ");
}
