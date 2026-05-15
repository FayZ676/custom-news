"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

import Modal from "@/components/Modal";
import { Tables } from "@/lib/supabase/supabase.types";

type UserCategory = Tables<"user_categories">;
type SubCategory = Tables<"global_sub_categories">;

export interface NewsCategoriesModalHandle {
  open: () => void;
}

interface NewsCategoriesModalProps {
  fetchData: () => Promise<{
    userCategories: UserCategory[];
    allCategories: string[];
    subCategoriesByCategory: Record<string, SubCategory[]>;
    subscribedSubCategories: string[];
  }>;
  handleSubscribeCategory: (categoryName: string) => Promise<void>;
  handleUnsubscribeCategory: (categoryName: string) => Promise<void>;
  handleReorderCategories: (orderedNames: string[]) => Promise<void>;
  handleSubscribeSubCategory: (subCategoryName: string) => Promise<void>;
  handleUnsubscribeSubCategory: (subCategoryName: string) => Promise<void>;
  handleSubscribeAllSubCategories: (categoryName: string) => Promise<void>;
  handleUnsubscribeAllSubCategories: (categoryName: string) => Promise<void>;
}

export const NewsCategoriesModal = forwardRef<
  NewsCategoriesModalHandle,
  NewsCategoriesModalProps
>(
  (
    {
      fetchData,
      handleSubscribeCategory,
      handleUnsubscribeCategory,
      handleReorderCategories,
      handleSubscribeSubCategory,
      handleUnsubscribeSubCategory,
      handleSubscribeAllSubCategories,
      handleUnsubscribeAllSubCategories,
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    type Status = "idle" | "loading" | "loaded" | "error";
    const [status, setStatus] = useState<Status>("idle");
    const [hasChanges, setIsDirty] = useState(false);
    const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [subCategoriesByCategory, setSubCategoriesByCategory] = useState<
      Record<string, SubCategory[]>
    >({});
    const [subscribedSubCategories, setSubscribedSubCategories] = useState<
      string[]
    >([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(
      null,
    );
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({
      async open() {
        setStatus("loading");
        setIsDirty(false);
        dialogRef.current?.showModal();
        try {
          const data = await fetchData();
          setUserCategories(data.userCategories);
          setAllCategories(data.allCategories);
          setSubCategoriesByCategory(data.subCategoriesByCategory);
          setSubscribedSubCategories(data.subscribedSubCategories);
          setStatus("loaded");
        } catch {
          setStatus("error");
        }
      },
    }));

    const subscribedNames = new Set(userCategories.map((c) => c.category_name));
    const unsubscribedCategories = allCategories.filter(
      (name) => !subscribedNames.has(name),
    );

    const router = useRouter();

    async function toggleCategory(categoryName: string, isSubscribed: boolean) {
      const subCatNames = (subCategoriesByCategory[categoryName] ?? []).map(
        (s) => s.name,
      );
      if (isSubscribed) {
        await handleUnsubscribeCategory(categoryName);
        setUserCategories((prev) =>
          prev.filter((c) => c.category_name !== categoryName),
        );
        setSubscribedSubCategories((prev) =>
          prev.filter((n) => !subCatNames.includes(n)),
        );
      } else {
        await handleSubscribeCategory(categoryName);
        const nextPosition =
          userCategories.length > 0
            ? Math.max(...userCategories.map((c) => c.position)) + 1
            : 1;
        setUserCategories((prev) => [
          ...prev,
          { user_id: "", category_name: categoryName, position: nextPosition },
        ]);
        setSubscribedSubCategories((prev) => [
          ...new Set([...prev, ...subCatNames]),
        ]);
      }
      setIsDirty(true);
    }

    async function toggleAllSubCategories(
      categoryName: string,
      allSubscribed: boolean,
    ) {
      const names = (subCategoriesByCategory[categoryName] ?? []).map(
        (s) => s.name,
      );
      if (allSubscribed) {
        await handleUnsubscribeAllSubCategories(categoryName);
        setSubscribedSubCategories((prev) =>
          prev.filter((n) => !names.includes(n)),
        );
      } else {
        await handleSubscribeAllSubCategories(categoryName);
        setSubscribedSubCategories((prev) => [...new Set([...prev, ...names])]);
      }
      setIsDirty(true);
    }

    async function toggleSubCategory(name: string, isSubscribed: boolean) {
      if (isSubscribed) {
        await handleUnsubscribeSubCategory(name);
        setSubscribedSubCategories((prev) => prev.filter((n) => n !== name));
      } else {
        await handleSubscribeSubCategory(name);
        setSubscribedSubCategories((prev) => [...prev, name]);
      }
      setIsDirty(true);
    }

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", String(index));
    }, []);

    const handleDrop = useCallback(
      async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = Number(e.dataTransfer.getData("text/plain"));
        if (dragIndex === dropIndex) return;

        const reordered = [...userCategories];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(dropIndex, 0, moved);
        const updated = reordered.map((c, i) => ({ ...c, position: i + 1 }));
        setUserCategories(updated);
        setDragOverIndex(null);
        await handleReorderCategories(updated.map((c) => c.category_name));
        setIsDirty(true);
      },
      [userCategories, handleReorderCategories],
    );

    return (
      <Modal ref={dialogRef}>
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold pr-6">News Categories</h3>

          {status === "loading" && (
            <p className="text-sm">Loading your categories…</p>
          )}

          {status === "error" && (
            <p className="text-sm text-error">
              Failed to load categories. Please try again.
            </p>
          )}

          {status === "loaded" && (
            <div className="flex flex-col gap-4">
              {/* Subscribed categories — drag to reorder */}
              {userCategories.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Subscribed — drag to reorder
                  </p>
                  {userCategories.map((cat, index) => (
                    <div
                      key={cat.category_name}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverIndex(index);
                      }}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`border rounded p-2 cursor-grab transition-colors ${
                        dragOverIndex === index
                          ? "border-primary bg-base-200"
                          : "border-neutral-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 text-xs select-none">
                            ⠿
                          </span>
                          <button
                            onClick={() =>
                              setExpandedCategory(
                                expandedCategory === cat.category_name
                                  ? null
                                  : cat.category_name,
                              )
                            }
                            className="text-sm font-medium hover:underline text-left"
                          >
                            {cat.category_name}
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            toggleCategory(cat.category_name, true)
                          }
                          className="text-xs text-error hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Sub-categories accordion */}
                      {expandedCategory === cat.category_name && (
                        <div className="mt-2 pl-5 flex flex-col gap-1">
                          {(() => {
                            const subCats =
                              subCategoriesByCategory[cat.category_name] ?? [];
                            if (subCats.length === 0) {
                              return (
                                <p className="text-xs italic text-neutral-500">
                                  No sub-categories defined.
                                </p>
                              );
                            }
                            const allSubscribed = subCats.every((s) =>
                              subscribedSubCategories.includes(s.name),
                            );
                            return (
                              <>
                                {/* Everything toggle */}
                                <div className="flex items-center justify-between border-b border-neutral-700 pb-1 mb-1">
                                  <span className="text-sm font-medium">
                                    Everything
                                  </span>
                                  <button
                                    onClick={() =>
                                      toggleAllSubCategories(
                                        cat.category_name,
                                        allSubscribed,
                                      )
                                    }
                                    className={`text-xs hover:underline ${
                                      allSubscribed
                                        ? "text-error"
                                        : "text-primary"
                                    }`}
                                  >
                                    {allSubscribed
                                      ? "Unsubscribe all"
                                      : "Subscribe to all"}
                                  </button>
                                </div>
                                {/* Individual subcategory rows */}
                                {subCats.map((sub) => {
                                  const isSubbed =
                                    subscribedSubCategories.includes(sub.name);
                                  return (
                                    <div
                                      key={sub.name}
                                      className="flex items-center justify-between"
                                    >
                                      <span className="text-sm">
                                        {sub.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          toggleSubCategory(sub.name, isSubbed)
                                        }
                                        className={`text-xs hover:underline ${
                                          isSubbed
                                            ? "text-error"
                                            : "text-primary"
                                        }`}
                                      >
                                        {isSubbed ? "Unsubscribe" : "Subscribe"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Unsubscribed categories */}
              {unsubscribedCategories.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Available
                  </p>
                  {unsubscribedCategories.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between border border-neutral-400 rounded p-2"
                    >
                      <span className="text-sm">{name}</span>
                      <button
                        onClick={() => toggleCategory(name, false)}
                        className="text-xs text-primary hover:underline"
                      >
                        Subscribe
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasChanges && (
            <div className="flex items-center justify-between gap-3 bg-base-200 border border-base-content/20 rounded px-3 py-2">
              <p className="text-xs opacity-70">
                Reload the feed to see your changes.
              </p>
              <button
                onClick={() => {
                  router.refresh();
                  dialogRef.current?.close();
                  setIsDirty(false);
                }}
                className="text-xs font-semibold whitespace-nowrap hover:underline"
              >
                Reload now
              </button>
            </div>
          )}
        </div>
      </Modal>
    );
  },
);

NewsCategoriesModal.displayName = "NewsCategoriesModal";
