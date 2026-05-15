"use client";

import { useRef } from "react";

import { Database, Tables } from "@/lib/supabase/supabase.types";

import {
  FeedbackModal,
  type FeedbackModalHandle,
} from "@/components/FeedbackModal";
import {
  SettingsModal,
  type SettingsModalHandle,
} from "@/components/SettingsModal";
import {
  NewsCategoriesModal,
  type NewsCategoriesModalHandle,
} from "@/components/NewsCategoriesModal";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
type SubCategory = Tables<"global_sub_categories">;

interface FooterProps {
  userEmail: string;
  handleSignOut: () => Promise<void>;
  fetchSettings: () => Promise<UserSettings>;
  handleUpdateNotifications: (newValue: boolean) => Promise<void>;
  handleUpdateTheme: (newTheme: string) => Promise<void>;
  fetchCategoriesData: () => Promise<{
    userCategories: Tables<"user_categories">[];
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

export function Footer({
  userEmail,
  handleSignOut,
  fetchSettings,
  handleUpdateNotifications,
  handleUpdateTheme,
  fetchCategoriesData,
  handleSubscribeCategory,
  handleUnsubscribeCategory,
  handleReorderCategories,
  handleSubscribeSubCategory,
  handleUnsubscribeSubCategory,
  handleSubscribeAllSubCategories,
  handleUnsubscribeAllSubCategories,
}: FooterProps) {
  const feedbackModalRef = useRef<FeedbackModalHandle>(null);
  const settingsModalRef = useRef<SettingsModalHandle>(null);
  const newsCategoriesModalRef = useRef<NewsCategoriesModalHandle>(null);

  return (
    <footer className="text-sm">
      <div className="flex flex-col gap-4 divide-y divide-neutral-400">
        <div>
          <button
            onClick={() => feedbackModalRef.current?.open()}
            className="cursor-pointer hover:font-bold hover:underline pb-3"
          >
            Send Feedback
          </button>
        </div>
        <div>
          <button
            onClick={() => settingsModalRef.current?.open()}
            className="cursor-pointer hover:font-bold hover:underline pb-3"
          >
            Settings
          </button>
        </div>
        <span className="italic">{userEmail}</span>
      </div>

      <FeedbackModal ref={feedbackModalRef} userEmail={userEmail} />
      <SettingsModal
        ref={settingsModalRef}
        fetchSettings={fetchSettings}
        handleUpdateNotifications={handleUpdateNotifications}
        handleUpdateTheme={handleUpdateTheme}
        handleSignOut={handleSignOut}
        onOpenNewsCategories={() => {
          settingsModalRef.current?.close();
          newsCategoriesModalRef.current?.open();
        }}
      />
      <NewsCategoriesModal
        ref={newsCategoriesModalRef}
        fetchData={fetchCategoriesData}
        handleSubscribeCategory={handleSubscribeCategory}
        handleUnsubscribeCategory={handleUnsubscribeCategory}
        handleReorderCategories={handleReorderCategories}
        handleSubscribeSubCategory={handleSubscribeSubCategory}
        handleUnsubscribeSubCategory={handleUnsubscribeSubCategory}
        handleSubscribeAllSubCategories={handleSubscribeAllSubCategories}
        handleUnsubscribeAllSubCategories={handleUnsubscribeAllSubCategories}
      />
    </footer>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="mt-auto text-sm">
      <div>
        <div className="flex border-b py-3">
          <div className="skeleton h-4 w-28 rounded" />
        </div>
        <div className="flex border-b py-3">
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="skeleton h-4 w-44 rounded my-3" />
      </div>
    </footer>
  );
}
