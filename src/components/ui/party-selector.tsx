"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Building, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Party {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface PartySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  parties: Party[];
  onPartiesUpdate?: () => void;
}

export function PartySelector({
  value,
  onValueChange,
  parties,
  onPartiesUpdate,
}: PartySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [localParties, setLocalParties] = useState<Party[]>(parties);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setLocalParties(parties);
  }, [parties]);

  const handleCreateParty = async () => {
    if (!searchValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a party name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/parties/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchValue.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new party to local state
        const newParty = data.party;
        setLocalParties(prev => [newParty, ...prev]);
        
        // Select the newly created party
        onValueChange(newParty.id);
        setOpen(false);
        setSearchValue("");
        
        // Show success toast with action to edit details
        toast({
          title: "✨ New Party Created!",
          description: (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{newParty.name} has been added successfully.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  router.push(`/admin/parties?edit=${newParty.id}`);
                }}
                className="w-fit"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Details
              </Button>
            </div>
          ),
          duration: 7000,
        });

        // Refresh parties list if callback provided
        if (onPartiesUpdate) {
          onPartiesUpdate();
        }
      } else if (response.status === 409) {
        // Party already exists
        if (data.party) {
          onValueChange(data.party.id);
          setOpen(false);
          toast({
            title: "Party Already Exists",
            description: `Selected existing party: ${data.party.name}`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create party",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong while creating the party",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredParties = localParties.filter(party =>
    party.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedParty = localParties.find(p => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedParty ? (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate">{selectedParty.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a party...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <input
              placeholder="Search or create party..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredParties.length === 0 && searchValue.trim()) {
                  e.preventDefault();
                  handleCreateParty();
                }
              }}
            />
          </div>
          <CommandList>
            {filteredParties.length === 0 && searchValue.trim() && (
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-dashed"
                  onClick={handleCreateParty}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                      Create "{searchValue}"
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 px-2">
                  Press Enter or click to create a new party
                </p>
              </div>
            )}
            {filteredParties.length === 0 && !searchValue.trim() && (
              <CommandEmpty>Start typing to search parties...</CommandEmpty>
            )}
            {filteredParties.length > 0 && (
              <CommandGroup>
                <AnimatePresence mode="popLayout">
                  {filteredParties.map((party) => (
                    <motion.div
                      key={party.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <CommandItem
                        value={party.id}
                        onSelect={() => {
                          onValueChange(party.id);
                          setOpen(false);
                          setSearchValue("");
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === party.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{party.name}</div>
                          {(party.email || party.phone) && (
                            <div className="text-xs text-muted-foreground">
                              {party.email && <span>{party.email}</span>}
                              {party.email && party.phone && <span> • </span>}
                              {party.phone && <span>{party.phone}</span>}
                            </div>
                          )}
                        </div>
                        {!party.email && !party.phone && (
                          <Badge variant="outline" className="text-xs">
                            Incomplete
                          </Badge>
                        )}
                      </CommandItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {searchValue && filteredParties.length > 0 && (
                  <div className="border-t mt-2 pt-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                      onClick={handleCreateParty}
                      disabled={isCreating}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create new party "{searchValue}"
                    </Button>
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}