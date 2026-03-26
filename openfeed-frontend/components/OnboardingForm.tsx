"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { Check, X, Plus, ArrowRight } from "lucide-react";

import { Database } from "@/lib/supabase/supabase.types";

import { addInterest } from "@/actions/interests";
import { subscribeToCategory } from "@/actions/subscriptions";

type Category = Pick<
  Database["public"]["Tables"]["global_categories"]["Row"],
  "id" | "name" | "interest_suggestions"
>;

export function OnboardingForm({ categories }: { categories: Category[] }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");

  const suggestions = categories
    .filter((c) => selectedCategories.includes(c.id))
    .flatMap((c) => c.interest_suggestions as string[]);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  }

  function addCustomInterest() {
    const trimmed = customInterest.trim();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests((prev) => [...prev, trimmed]);
      setCustomInterest("");
    }
  }

  async function handleSubmit() {
    await Promise.all(selectedCategories.map((id) => subscribeToCategory(id)));
    const interestIds = await Promise.all(
      selectedInterests.map((query) => addInterest(query)),
    );
    const lastId = interestIds[interestIds.length - 1];
    redirect(lastId ? `/feed?interest=${lastId}` : "/feed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-10 py-16">
        {/* Categories */}
        <section className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">What are you into?</h1>
            <p className="text-sm text-base-content/50 mt-1">
              Pick as many as you like.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`btn btn-sm rounded-full ${active ? "btn-neutral" : "btn-outline"}`}
                >
                  {active && <Check size={13} strokeWidth={2.5} />}
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>

        {selectedCategories.length > 0 && (
          <>
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Suggested interests</h2>
                  <p className="text-sm text-base-content/50 mt-1">
                    Select any that resonate.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => {
                    const active = selectedInterests.includes(suggestion);
                    return (
                      <button
                        key={suggestion}
                        onClick={() => toggleInterest(suggestion)}
                        className={`btn btn-sm rounded-full ${active ? "btn-neutral" : "btn-outline"}`}
                      >
                        {active && <Check size={13} strokeWidth={2.5} />}
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Custom interest */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Add your own</h2>
                <p className="text-sm text-base-content/50 mt-1">
                  Anything not listed above.
                </p>
              </div>
              <div className="join w-full">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
                  placeholder="e.g. large language models"
                  className="input input-bordered join-item flex-1 focus:outline-none"
                />
                <button
                  onClick={addCustomInterest}
                  disabled={!customInterest.trim()}
                  className="btn btn-neutral join-item"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Add
                </button>
              </div>

              {/* Selected interests */}
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="badge badge-neutral badge-lg gap-1.5 py-3"
                    >
                      {interest}
                      <button onClick={() => toggleInterest(interest)}>
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Submit */}
            <button onClick={handleSubmit} className="btn btn-neutral">
              Continue
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
