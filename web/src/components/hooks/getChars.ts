import { useState, useEffect } from 'react';
import { Character, CharacterResponse } from '@/types';
import { fetchNui } from '@/utils/fetchNui';

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxSlots, setMaxSlots] = useState<number>(3);
  const [autoload, setAutoload] = useState<boolean>(false);

  useEffect(() => { // i hate this whole thing
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const response = await fetchNui<CharacterResponse>('getCharacterSlots');
        let charArray: Character[] = [];
        if (Array.isArray(response.characters)) {
          charArray = response.characters
            .filter((char): char is Character => char !== null)
            .map(char => ({
              ...char,
              char_slot: char.slot
            }));
        } else if (typeof response.characters === 'object') {
          charArray = Object.entries(response.characters) // eh?
            .filter(([_, char]) => char !== null)
            .map(([slot, char]) => ({
              ...char!,
              char_slot: parseInt(slot)
            }));
        }
        
        setCharacters(charArray);
        setMaxSlots(response.maxSlots || 3);
        setAutoload(response.autoload || false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch characters is your servers database started?');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const selectCharacter = async (slot: number) => {
    try {
      await fetchNui('selectCharacter', { slot });
      return true;
    } catch (err) {
      console.error('Error selecting character:', err);
      return false;
    }
  };

  return {
    characters,
    loading,
    error,
    maxSlots,
    autoload,
    selectCharacter
  };
};