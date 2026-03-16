"use client";

import { useState } from "react";
import { redirect } from "next/navigation";

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
    if (
      customInterest.trim() &&
      !selectedInterests.includes(customInterest.trim())
    ) {
      setSelectedInterests((prev) => [...prev, customInterest.trim()]);
      setCustomInterest("");
    }
  }

  async function handleSubmit() {
    // save category subscriptions
    await Promise.all(selectedCategories.map((id) => subscribeToCategory(id)));

    // save interests
    await Promise.all(selectedInterests.map((query) => addInterest(query)));

    redirect("/feed");
  }

  return (
    <div>
      <h1>Choose your categories</h1>
      {categories.map((category) => (
        <div key={category.id}>
          <input
            type="checkbox"
            checked={selectedCategories.includes(category.id)}
            onChange={() => toggleCategory(category.id)}
          />
          <label>{category.name}</label>
        </div>
      ))}

      {selectedCategories.length > 0 && (
        <>
          {suggestions.length > 0 && (
            <div>
              <h2>Suggested interests</h2>
              {suggestions.map((suggestion) => (
                <div key={suggestion}>
                  <input
                    type="checkbox"
                    checked={selectedInterests.includes(suggestion)}
                    onChange={() => toggleInterest(suggestion)}
                  />
                  <label>{suggestion}</label>
                </div>
              ))}
            </div>
          )}

          <div>
            <h2>Add a custom interest</h2>
            <input
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="e.g. large language models"
            />
            <button onClick={addCustomInterest}>Add</button>
          </div>

          {selectedInterests.length > 0 && (
            <div>
              <h2>Your interests</h2>
              {selectedInterests.map((interest) => (
                <span key={interest}>
                  {interest}
                  <button onClick={() => toggleInterest(interest)}>
                    Remove
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {selectedCategories.length > 0 && (
        <button onClick={handleSubmit}>Continue</button>
      )}
    </div>
  );
}
