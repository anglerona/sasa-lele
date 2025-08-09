"use client";
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DatePicker({ value, onChange, placeholder = "Pick a date", min, max }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;
  const [inputValue, setInputValue] = React.useState(value || "");

  React.useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    // Only update if valid date
    const d = new Date(e.target.value);
    if (!isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
      onChange(e.target.value);
    }
  }

  return (
    <div className="flex gap-2 items-center w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        pattern="\d{4}-\d{2}-\d{2}"
        className="w-full"
        autoComplete="off"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="px-2"
            tabIndex={-1}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={d => {
              if (d) onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }}
            initialFocus
            fromDate={min ? new Date(min) : undefined}
            toDate={max ? new Date(max) : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
