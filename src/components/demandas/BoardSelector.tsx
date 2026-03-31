import { useState } from "react";
import { Plus, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Board {
  id: string;
  name: string;
  description: string | null;
}

interface BoardSelectorProps {
  boards: Board[];
  currentBoard: Board | null;
  onSelect: (board: Board) => void;
  onCreate: (name: string, description: string) => void;
  onDuplicate?: (board: Board) => void;
}

export function BoardSelector({ boards, currentBoard, onSelect, onCreate, onDuplicate }: BoardSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name, desc);
    setName(""); setDesc("");
    setDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {currentBoard?.name || "Selecionar Board"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {boards.map(b => (
            <DropdownMenuItem key={b.id} onClick={() => onSelect(b)} className={b.id === currentBoard?.id ? "bg-accent" : ""}>
              {b.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {currentBoard && onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(currentBoard)}>
              <Copy className="h-4 w-4 mr-2" /> Duplicar Board Atual
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Novo Board</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Projeto X" autoFocus />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
