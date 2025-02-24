import React, { useEffect, useState } from 'react';
import { User, Plus, ChevronRight, MapPin, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import CreateCharacterForm from './CharacterCreate';
import NoiceButton from './ui/new-button';
import { Character, CharacterFormData, CharacterSelectionProps, HeadshotMessage, Headshots } from '@/types';
import { useCharacters } from './hooks/getChars';
import { fetchNui } from '@/utils/fetchNui';
import { useVisibility } from '../providers/VisibilityProvider';

const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  characters,
  selectedChar,
  maxSlots,
  onSelect,
  onNewCharacter,
  onPlay
}) => {
  const { setVisible } = useVisibility();
  const [headshots, setHeadshots] = useState<Record<number, string>>({});

  const handleCharacterSelect = async (char: Character) => {
    onSelect(char);
    try {
      await fetchNui('selectCharacter', { 
        slot: char.char_slot, 
        preview: true 
      });
    } catch (err) {
      console.error('Failed to trigger preview:', err);
    }
  };

  const handlePlay = async (slot: number) => {
    setVisible(false); // Hide UI when playing
    onPlay(slot);
  };

  const handleEmptySlotSelect = async (slot: number) => {
    try {
      await fetchNui('previewCharacter', { 
        slot: slot, 
        createMode: true,
        sex: 'male'
      });
      onNewCharacter(slot);
    } catch (err) {
      console.error('Failed to preview empty slot:', err);
      onNewCharacter(slot);
    }
  };

  useEffect(() => {
    const handleHeadshotUpdate = (event: MessageEvent) => {
      const message = event.data as HeadshotMessage;
      
      if (message.action === 'updateCharacterHeadshot') {
        setHeadshots((prev: Headshots) => ({
          ...prev,
          [message.data.slot]: `https://nui-img/${message.data.texture}/${message.data.texture}`
        }));
      }
    };
  
    window.addEventListener('message', handleHeadshotUpdate);
    return () => window.removeEventListener('message', handleHeadshotUpdate);
  }, []);

  return (
    <>
      <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className="flex items-center justify-between">
          <h2 className="text-[hsl(var(--foreground))] text-xl font-semibold">
            Select Character
          </h2>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">Select a character to play</p>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
        <div className="p-4 space-y-3">
          {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slotNum) => {
            const char = characters.find(c => c.char_slot === slotNum);
            if (char) {
  
              return (
                <Card
                  key={char.citizenid}
                  className={`p-4 border-0 rounded-none transition-all duration-200 hover:bg-[hsl(var(--secondary))] cursor-pointer ${
                    selectedChar?.citizenid === char.citizenid ? 'bg-[hsl(var(--secondary))]' : 'bg-[hsl(var(--card))]'
                  }`}
                  onClick={() => handleCharacterSelect(char)}  
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center overflow-hidden">
                        {headshots[slotNum] ? (
                          <img 
                            src={headshots[slotNum]} 
                            alt={`${char.Name.first_name} ${char.Name.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--foreground))]">
                          {`${char.Name.first_name} ${char.Name.last_name}`}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Slot {char.char_slot}
                          </div>
                          <div>
                            ${char.Money.cash} / ${char.Money.bank}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </Card>
              );
            } else {
              return (
                <Card
                  key={`empty-${slotNum}`}
                  className="p-4 rounded-none border-0 bg-[hsl(var(--card))] hover:bg-[hsl(var(--secondary)] transition-all cursor-pointer group"
                  onClick={() => handleEmptySlotSelect(slotNum)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center">
                      <Plus className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div className="font-medium text-[hsl(var(--muted-foreground))]">
                      Create Character (Slot {slotNum})
                    </div>
                  </div>
                </Card>
              );
            }
          })}
        </div>
      </ScrollArea>
      {selectedChar && (
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background)/0.8)] to-transparent pt-16 z-20">
          <NoiceButton onClick={() => handlePlay(selectedChar.char_slot)}>
            <Play className="w-5 h-5" strokeWidth={2} />
            <span className="font-semibold tracking-wide">Play Now</span>
          </NoiceButton>
        </div>
      )}
    </>
  );
};

const CharacterMenu: React.FC = () => {
  const { characters, loading, error, maxSlots, autoload, selectCharacter } = useCharacters();
  const { setVisible } = useVisibility();
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<number>(1);


  useEffect(() => { 
    if (!loading && !error && characters) {
      if (!autoload) {
        fetchNui('previewCharacter', { 
          slot: null, 
          preview: true 
        });
      }
    }
  }, [loading, error, characters, autoload]);

  if (!loading && !error && autoload && characters.length === 1) {
    return null; 
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg text-[hsl(var(--muted-foreground))]">Loading characters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg text-[hsl(var(--destructive))]">Error: {error}</div>
      </div>
    );
  }

  const handleCreateCharacter = async (formData: CharacterFormData & { name: string }): Promise<void> => {
    try {
      await fetchNui('createCharacter', {
        slot: currentSlot,
        firstName: formData.firstName,
        lastName: formData.lastName,
        sex: formData.sex,
        height: formData.height,
        birthday: formData.birthday
      });
      setVisible(false); 
    } catch (err) {
      console.error('Failed to create character:', err);
    }
  };

  const handleSelectCharacter = async (slot: number) => {
    await selectCharacter(slot);
    setVisible(false); 
  };


  return (
    <div className="flex h-screen w-full">
      <div className="w-96 h-full relative">
        <div
          className="h-full bg-[hsl(var(--background))] relative overflow-hidden flex flex-col border-r border-[hsl(var(--border))]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground) / 0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {isCreatingNew ? (
            <CreateCharacterForm
              onBack={() => setIsCreatingNew(false)}
              onSubmit={handleCreateCharacter}
              currentSlot={currentSlot}
            />
          ) : (
            <CharacterSelection
              characters={characters}
              selectedChar={selectedChar}
              maxSlots={maxSlots}
              onSelect={setSelectedChar}
              onNewCharacter={(slot: number) => {
                setCurrentSlot(slot);
                setIsCreatingNew(true);
              }}
              onPlay={handleSelectCharacter}
            />
          )}
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
};

export default CharacterMenu;