import { useState, useEffect } from 'react';
import { Character } from '@/types';
import { fetchNui } from '@/utils/fetchNui';

interface CharacterResponse {
  characters: { [key: string]: Character };
  maxSlots: number;
}

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxSlots, setMaxSlots] = useState<number>(3);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const response = await fetchNui<CharacterResponse>('getCharacterSlots');
        const charArray = Object.entries(response.characters)
          .map(([slot, char]) => {
            if (!char) {
              return null;
            }
            return {
              ...char,
              char_slot: Number(slot) + 1  // thanks objects! >:(
            };
          })
          .filter((char): char is Character => char !== null);
        
        console.log('Final processed characters:', charArray);
        
        setCharacters(charArray);
        setMaxSlots(response.maxSlots || 3);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch characters');
        console.error('Error fetching characters:', err);
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
    selectCharacter
  };
};