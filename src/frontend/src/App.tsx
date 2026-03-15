import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  useClearHistory,
  useDeleteEntry,
  useGetHistory,
  useLookupWord,
} from "@/hooks/useQueries";
import {
  AlertCircle,
  BookOpen,
  Loader2,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface DecodedResult {
  word: string;
  definition: string;
  example: string;
  partOfSpeech: string;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DecodedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: history = [] } = useGetHistory();
  const lookup = useLookupWord();
  const deleteEntry = useDeleteEntry();
  const clearHistory = useClearHistory();

  const handleDecode = async () => {
    const word = query.trim();
    if (!word) return;
    setErrorMsg("");
    setResult(null);
    try {
      const res = await lookup.mutateAsync(word);
      setResult(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setErrorMsg(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleDecode();
  };

  const handleHistoryClick = (
    word: string,
    definition: string,
    example: string,
  ) => {
    setQuery(word);
    setErrorMsg("");
    setResult({ word, definition, example, partOfSpeech: "" });
    inputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteEntry.mutateAsync(word);
    if (result?.word === word) {
      setResult(null);
      setQuery("");
    }
    toast.success(`Removed "${word}"`);
  };

  const handleClearAll = async () => {
    await clearHistory.mutateAsync();
    setResult(null);
    setQuery("");
    setErrorMsg("");
    toast.success("All words cleared");
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster richColors position="top-right" />

      <header
        className="relative overflow-hidden border-b border-border"
        style={{
          backgroundImage:
            "url('/assets/generated/word-decoder-bg.dim_1600x400.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <div className="absolute inset-0 bg-background/82" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-accent-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              For curious students
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground tracking-tight leading-tight mb-3">
              Word{" "}
              <span className="text-primary relative inline-block">
                Decoder
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6 Q50 2 100 5 Q150 8 198 3"
                    stroke="oklch(0.78 0.14 75)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-muted-foreground text-lg mt-5">
              Type any difficult word to understand it simply
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex gap-2 max-w-xl mx-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                data-ocid="decoder.search_input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search a word..."
                className="pl-10 pr-4 h-12 text-base bg-card border-border focus-visible:ring-primary/40 rounded-lg"
                aria-label="Search a word"
              />
            </div>
            <Button
              data-ocid="decoder.primary_button"
              onClick={handleDecode}
              disabled={lookup.isPending || !query.trim()}
              className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg"
            >
              {lookup.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Decode</span>
              )}
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        <AnimatePresence>
          {lookup.isPending && (
            <motion.div
              data-ocid="decoder.loading_state"
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 py-12 text-muted-foreground"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-base font-medium">
                Looking up the word…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorMsg && !lookup.isPending && (
            <motion.div
              data-ocid="decoder.error_state"
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-destructive/10 border border-destructive/25 rounded-xl px-5 py-4 text-destructive"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !lookup.isPending && (
            <motion.div
              data-ocid="decoder.result.card"
              key={result.word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="relative bg-card rounded-xl px-6 py-6 overflow-hidden border border-primary/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 right-8 w-16 h-16 rounded-full bg-accent/10 translate-y-1/3 pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-foreground capitalize leading-tight">
                      {result.word}
                    </h2>
                    {result.partOfSpeech && (
                      <span className="inline-block mt-1.5 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                        {result.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-foreground text-lg leading-relaxed">
                  {result.definition}
                </p>
                {result.example && (
                  <div className="mt-4 pl-4 border-l-2 border-accent/60">
                    <p className="text-muted-foreground italic text-base leading-relaxed">
                      “{result.example}”
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section aria-label="All decoded words and meanings">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                All Words &amp; Meanings
              </h3>
              {history.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {history.length} word{history.length !== 1 ? "s" : ""} decoded
                </p>
              )}
            </div>
            {history.length > 0 && (
              <Button
                data-ocid="decoder.clear_history.button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={clearHistory.isPending}
                className="text-muted-foreground hover:text-destructive gap-1.5 text-sm"
              >
                {clearHistory.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Clear All
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <motion.div
              data-ocid="decoder.history.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-5">
                <BookOpen className="h-7 w-7" />
              </div>
              <p className="text-base font-medium">No words decoded yet</p>
              <p className="text-sm mt-1.5 opacity-70">
                Search a word above and press Decode to get started
              </p>
            </motion.div>
          ) : (
            <motion.div layout className="space-y-3">
              <AnimatePresence>
                {history.map((entry, idx) => (
                  <motion.div
                    key={entry.word}
                    data-ocid={`decoder.history.item.${idx + 1}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22, delay: idx * 0.04 }}
                    className="group bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors cursor-pointer"
                    onClick={() =>
                      handleHistoryClick(
                        entry.word,
                        entry.definition,
                        entry.example,
                      )
                    }
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleHistoryClick(
                          entry.word,
                          entry.definition,
                          entry.example,
                        );
                      }
                    }}
                    aria-label={`View full meaning of ${entry.word}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="font-display text-lg font-bold text-foreground capitalize">
                            {entry.word}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {entry.definition}
                        </p>
                        {entry.example && (
                          <p className="text-sm text-muted-foreground italic mt-2 leading-relaxed">
                            “{entry.example}”
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        data-ocid={`decoder.history.delete_button.${idx + 1}`}
                        onClick={(e) => handleDelete(entry.word, e)}
                        disabled={deleteEntry.isPending}
                        className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remove ${entry.word}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      <footer className="border-t border-border py-5 px-4 text-center text-sm text-muted-foreground">
        © {year}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
