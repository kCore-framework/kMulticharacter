import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import NoiceButton from './ui/new-button';
import type { SelectSingleEventHandler } from 'react-day-picker';
import { CharacterFormData, CreateCharacterFormProps } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { fetchNui } from '@/utils/fetchNui';

const CreateCharacterForm: React.FC<CreateCharacterFormProps> = ({ onBack, onSubmit, currentSlot }) => { 
    const [formData, setFormData] = useState<CharacterFormData>({
      firstName: '',
      lastName: '',
      height: 170,
      birthday: '',
      sex: 'male'
    });
  

  const [date, setDate] = useState<Date | undefined>();
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      birthday: date ? date.toISOString().split('T')[0] : ''
    });
  };

  const handleDateSelect: SelectSingleEventHandler = (selectedDate) => {
    setDate(selectedDate);
  };

  const years = Array.from(
    { length: new Date().getFullYear() - 1920 + 1 },
    (_, i) => 1920 + i
  );
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const handleSexChange = async (sex: 'male' | 'female') => {
    setFormData(prev => ({ ...prev, sex }));
    try {
      await fetchNui('previewCharacter', {
        slot: currentSlot,
        createMode: true,
        sex: sex
      });
    } catch (err) {
      console.error('Failed to update preview:', err);
    }
  };


  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
            Create Character
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">Enter your character details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 h-[calc(100vh-8.5rem)]">
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  required
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="h-12 bg-[hsl(var(--secondary)/0.9)] border-0 focus:ring-2 ring-[hsl(var(--primary)/0.2)]"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  required
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="h-12 bg-[hsl(var(--secondary)/0.9)] border-0 focus:ring-2 ring-[hsl(var(--primary)/0.2)]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-[hsl(var(--secondary)/0.9)] border-0 focus:ring-2 ring-[hsl(var(--primary)/0.2)]",
                      !date && "text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    {date ? formatDate(date) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[hsl(var(--background)/0.95)] backdrop-blur-md border border-[hsl(var(--border)/0.5)]"
                  align="start"
                >
                  <div className="flex gap-2 p-3 border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--secondary)/0.95)]">
                    <Select
                      value={calendarMonth.getMonth().toString()}
                      onValueChange={(value) => {
                        const newDate = new Date(calendarMonth);
                        newDate.setMonth(parseInt(value));
                        setCalendarMonth(newDate);
                      }}
                    >
                      <SelectTrigger className="w-[140px] bg-[hsl(var(--secondary)/0.95)] border-0 focus:ring-2 ring-[hsl(var(--primary)/0.2)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(var(--background)/0.95)] backdrop-blur-md border border-[hsl(var(--border)/0.5)]">
                        {months.map((month, index) => (
                          <SelectItem
                            key={index}
                            value={index.toString()}
                            className="hover:bg-[hsl(var(--secondary)/0.95)] focus:bg-[hsl(var(--secondary)/0.95)]"
                          >
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={calendarMonth.getFullYear().toString()}
                      onValueChange={(value) => {
                        const newDate = new Date(calendarMonth);
                        newDate.setFullYear(parseInt(value));
                        setCalendarMonth(newDate);
                      }}
                    >
                      <SelectTrigger className="w-[100px] bg-[hsl(var(--secondary)/0.95)] border-0 focus:ring-2 ring-[hsl(var(--primary)/0.2)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(var(--background)/0.95)] backdrop-blur-md border border-[hsl(var(--border)/0.5)] max-h-[300px]">
                        {years.reverse().map((year) => (
                          <SelectItem
                            key={year}
                            value={year.toString()}
                            className="hover:bg-[hsl(var(--secondary)/0.95)] focus:bg-[hsl(var(--secondary)/0.95)]"
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    initialFocus
                    className="p-3"
                    classNames={{
                      months: "space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-[hsl(var(--secondary)/0.95)]",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-[hsl(var(--muted-foreground))] rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[hsl(var(--accent))]",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[hsl(var(--secondary)/0.95)] rounded-md hover:bg-[hsl(var(--primary)/0.2)] hover:text-[hsl(var(--primary))] focus:bg-[hsl(var(--primary)/0.2)] focus:text-[hsl(var(--primary))]",
                      day_selected: "bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.3)] hover:text-[hsl(var(--primary))] focus:bg-[hsl(var(--primary)/0.3)] focus:text-[hsl(var(--primary))]",
                      day_today: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
                      day_outside: "text-[hsl(var(--muted-foreground))] opacity-50",
                      day_disabled: "text-[hsl(var(--muted-foreground))] opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Height</Label>
                <span className="text-lg font-medium text-[hsl(var(--primary))]">{formData.height} cm</span>
              </div>
              <div className="space-y-6">
                <Slider
                  value={[formData.height]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, height: value }))}
                  max={200}
                  min={150}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                  <span>150 cm</span>
                  <span>200 cm</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Sex</Label>
              <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSexChange('male')}
                className={`h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 
                ${formData.sex === 'male' 
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))]' 
                    : 'border-[hsl(var(--border)/0.5)] bg-[hsl(var(--secondary)/0.9)] hover:bg-[hsl(var(--secondary)/0.95)] text-[hsl(var(--muted-foreground))]'}`}
            >
                <span className="font-medium">Male</span>
            </button>
            <button
                type="button"
                onClick={() => handleSexChange('female')}
                className={`h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 
                ${formData.sex === 'female' 
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))]' 
                    : 'border-[hsl(var(--border)/0.5)] bg-[hsl(var(--secondary)/0.9)] hover:bg-[hsl(var(--secondary)/0.95)] text-[hsl(var(--muted-foreground))]'}`}
            >
                <span className="font-medium">Female</span>
            </button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[hsl(var(--background)/0.95)] via-[hsl(var(--background)/0.8)] to-transparent pt-16 z-20">
          <NoiceButton type="submit">
            <Play className="w-5 h-5" strokeWidth={2} />
            <span className="font-semibold tracking-wide">Create Character</span>
          </NoiceButton>
        </div>
      </form>
    </div>
  );
};

export default CreateCharacterForm;