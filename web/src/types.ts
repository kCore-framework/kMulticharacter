export interface Character {
    id: number;
    citizenid: string;
    char_slot: number; 
    Name: {
        first_name: string;
        last_name: string;
    };
    Stats: {
        hunger: number;
        thirst: number;
    };
    Appearance: {
        model: string;
        clothing: Record<string, unknown>;
        genetics: Record<string, unknown>;
        faceFeatures: Record<string, unknown>;
        headOverlays: Record<string, unknown>;
    };
    Money: {
        cash: number;
        bank: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
        heading: number;
    };
    Job: {
        name: string;
        grade: number;
    }
}

export interface CharacterFormData {
    firstName: string;
    lastName: string;
    height: number;
    birthday: string;
    sex: 'male' | 'female';
}

export interface CharacterSelectionProps {
    characters: Character[];
    selectedChar: Character | null;
    onSelect: (char: Character) => void;
    onNewCharacter: (slot: number) => void; 
    maxSlots: number;
    onPlay: (slot: number) => void;
}

export interface CreateCharacterFormProps {
    onBack: () => void;
    onSubmit: (data: CharacterFormData & { name: string }) => void;
    currentSlot: number;
}

export interface Headshots {
    [key: number]: string;
}
  

export interface HeadshotMessage {
    action: 'updateCharacterHeadshot';
    data: {
      slot: number;
      texture: string;
    };
  }