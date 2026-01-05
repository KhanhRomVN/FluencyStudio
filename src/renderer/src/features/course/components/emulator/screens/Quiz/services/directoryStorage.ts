export interface DirectoryEntry {
  word: string;
  source: 'FreeDict' | 'DictAPI'; // Simple tags for the APIs
  phonetics: { text: string; audio?: string; tag?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      translations: string[];
    }[];
  }[];
}

class DirectoryStorage {
  private storage: Map<string, DirectoryEntry> = new Map();
  private listeners: (() => void)[] = [];

  constructor() {}

  getEntry(word: string): DirectoryEntry | undefined {
    return this.storage.get(word.toLowerCase());
  }

  saveEntry(entry: DirectoryEntry) {
    this.storage.set(entry.word.toLowerCase(), entry);
    this.notifyListeners();
  }

  getSize(): number {
    return this.storage.size;
  }

  getStats(): { count: number; size: string } {
    const count = this.storage.size;
    let totalBytes = 0;

    // Rough estimation using JSON stringify length of values
    // This is expensive if storage is huge, but fine for typical session usage
    for (const entry of this.storage.values()) {
      try {
        totalBytes += JSON.stringify(entry).length;
      } catch (e) {
        // ignore circular or error, approximate
      }
    }

    // Format size
    let sizeStr = '';
    if (totalBytes < 1024) {
      sizeStr = `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
      sizeStr = `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      sizeStr = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return { count, size: sizeStr };
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  clear() {
    this.storage.clear();
    this.notifyListeners();
  }

  async fetchAndSave(word: string): Promise<DirectoryEntry | null> {
    const existing = this.getEntry(word);
    if (existing) return existing;

    try {
      let data: any = null;
      let usedFallback = false;

      // Try primary API
      try {
        const response = await fetch(
          `https://freedictionaryapi.com/api/v1/entries/en/${word}?translations=true`,
        );
        if (response.ok) {
          data = await response.json();

          // Check quality
          const entries = data.entries || [];
          // If no entries or no meanings in first entry, consider it "bad"
          const isBad =
            entries.length === 0 ||
            (entries[0].senses &&
              entries[0].senses.length === 0 &&
              entries[0].meanings &&
              entries[0].meanings.length === 0);

          if (isBad) {
            console.warn(`Primary API result poor for '${word}', trying fallback...`);
            data = null; // force fallback
          }
        }
      } catch (e) {
        console.warn('Primary API failed, trying fallback...');
        data = null;
      }

      // Try fallback API if data is missing
      if (!data) {
        try {
          const fallbackRes = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
          );
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            // This API returns array of entries directly
            if (Array.isArray(fallbackData) && fallbackData.length > 0) {
              data = fallbackData;
              usedFallback = true;
            }
          }
        } catch (e) {
          console.error('Fallback API also failed', e);
        }
      }

      if (!data) return null;

      const parsedEntry: DirectoryEntry = {
        word: (usedFallback ? data[0]?.word : data.word) || word,
        source: usedFallback ? 'DictAPI' : 'FreeDict',
        phonetics: [],
        meanings: [],
      };

      const hasEntries = usedFallback
        ? Array.isArray(data)
        : data.entries && Array.isArray(data.entries);
      const entries = usedFallback ? data : data.entries || [];

      if (!hasEntries || entries.length === 0) return null;

      // Extract unique phonetics (UK preferred)
      const phoneticsMap = new Map<string, { text: string; audio?: string; tag?: string }>();

      entries.forEach((entry: any) => {
        // Filter for UK pronunciations
        if (entry.pronunciations) {
          entry.pronunciations.forEach((p: any) => {
            // Primary API uses 'tags' array. Fallback API uses 'audio' URL sometimes containing 'uk'.

            if (usedFallback) {
              // Fallback API structure: { text: "...", audio: "..." }
              // Try to guess tag from audio url if available
              let isUK = false;
              if (p.audio && p.audio.includes('-uk')) isUK = true;

              // If text exists
              if (p.text) {
                if (isUK || !phoneticsMap.has(p.text)) {
                  // Overwrite if UK, or set if new
                  const tag = isUK ? 'UK' : undefined;
                  // If we already have this text but current one is UK and prev wasnt, update it
                  const existingP = phoneticsMap.get(p.text);
                  if (!existingP || (isUK && existingP.tag !== 'UK')) {
                    phoneticsMap.set(p.text, { text: p.text, audio: p.audio, tag });
                  }
                }
              }
            } else {
              // Primary API
              const parseTags = p.tags || [];
              if (parseTags.includes('UK') || parseTags.includes('British')) {
                // Prefer IPA
                if (!phoneticsMap.has(p.text)) {
                  phoneticsMap.set(p.text, { text: p.text, audio: p.audio, tag: 'UK' });
                }
              }
            }
          });
        }

        // If fallback and no phonetics found via helper loop (sometimes they are top level, sometimes inside phonetics array)
        if (usedFallback && entry.phonetic && phoneticsMap.size === 0) {
          phoneticsMap.set(entry.phonetic, { text: entry.phonetic, audio: undefined });
        }
      });
      parsedEntry.phonetics = Array.from(phoneticsMap.values());

      entries.forEach((entry: any) => {
        if (usedFallback) {
          // Fallback API structure
          const meanings = entry.meanings || [];
          meanings.forEach((m: any) => {
            const partOfSpeech = m.partOfSpeech;
            const meaningGroup: DirectoryEntry['meanings'][0] = {
              partOfSpeech,
              definitions: [],
            };

            if (m.definitions) {
              m.definitions.forEach((d: any) => {
                meaningGroup.definitions.push({
                  definition: d.definition,
                  example: d.example,
                  translations: [], // Fallback API usually has no translations
                });
              });
            }

            if (meaningGroup.definitions.length > 0) {
              parsedEntry.meanings.push(meaningGroup);
            }
          });
        } else {
          // Primary API structure
          const partOfSpeech = entry.partOfSpeech;

          const meaningGroup: DirectoryEntry['meanings'][0] = {
            partOfSpeech,
            definitions: [],
          };

          if (entry.senses) {
            entry.senses.forEach((sense: any) => {
              // Get Vietnamese translations
              const viTranslations = (sense.translations || [])
                .filter((t: any) => t.language && t.language.code === 'vi')
                .map((t: any) => t.word);

              meaningGroup.definitions.push({
                definition: sense.definition,
                example: sense.examples ? sense.examples[0] : undefined, // Take first example
                translations: viTranslations,
              });
            });
          }

          if (meaningGroup.definitions.length > 0) {
            parsedEntry.meanings.push(meaningGroup);
          }
        }
      });

      // Filter empty meanings
      parsedEntry.meanings = parsedEntry.meanings.filter((m) => m.definitions.length > 0);

      if (parsedEntry.meanings.length === 0) return null;

      this.saveEntry(parsedEntry);
      return parsedEntry;
    } catch (error) {
      console.error('Failed to fetch word definition:', error);
      return null;
    }
  }
}

export const directoryStorage = new DirectoryStorage();
