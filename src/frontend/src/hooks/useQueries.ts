import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WordEntry } from "../backend.d";
import { useActor } from "./useActor";

export function useGetHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<WordEntry[]>({
    queryKey: ["history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLookupWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      if (!actor) throw new Error("Not connected");

      let raw: string;
      try {
        raw = await actor.lookupWord(word.trim().toLowerCase());
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.toLowerCase().includes("empty") ||
          msg.toLowerCase().includes("trap")
        ) {
          throw new Error(
            "Could not reach the dictionary service. Please try again in a moment.",
          );
        }
        throw new Error(
          "Dictionary lookup failed. Please check your connection and try again.",
        );
      }

      // Handle empty or whitespace response
      if (!raw || raw.trim() === "") {
        throw new Error(
          `No definition found for "${word}". Try checking the spelling.`,
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("Received an unexpected response. Please try again.");
      }

      // API returns an object with a title when word is not found or on error
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        "title" in parsed
      ) {
        throw new Error(
          `No definition found for "${word}". Try checking the spelling.`,
        );
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(
          `No definition found for "${word}". Try checking the spelling.`,
        );
      }

      const entry = parsed[0] as Record<string, unknown>;
      const meanings = entry?.meanings as
        | Array<Record<string, unknown>>
        | undefined;
      const firstMeaning = meanings?.[0];
      const definitions = firstMeaning?.definitions as
        | Array<Record<string, unknown>>
        | undefined;
      const firstDef = definitions?.[0];

      const definition =
        typeof firstDef?.definition === "string" && firstDef.definition.trim()
          ? firstDef.definition
          : "No definition available.";
      const example: string =
        typeof firstDef?.example === "string" ? firstDef.example : "";
      const partOfSpeech: string =
        typeof firstMeaning?.partOfSpeech === "string"
          ? firstMeaning.partOfSpeech
          : "";

      await actor.storeWordEntry(
        word.trim().toLowerCase(),
        definition,
        example,
      );
      await queryClient.invalidateQueries({ queryKey: ["history"] });

      return {
        word: word.trim().toLowerCase(),
        definition,
        example,
        partOfSpeech,
      };
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteEntry(word);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useClearHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.clearHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
