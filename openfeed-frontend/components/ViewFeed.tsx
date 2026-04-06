"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useOptimistic } from "react";

import {
  LogOut,
  MessageSquare,
  MessageSquareCheck,
  UserRound,
} from "lucide-react";

import { Forminit } from "forminit";

import { InterestArticles, QueryArticle } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";
import { getCurrentDate, getUserLocation } from "@/lib/utils";

import Banner from "@/components/Banner";
import SearchBar from "@/components/Searchbar";
import { NavbarSkeleton } from "@/components/Navbar";
import SectionInterest from "@/components/SectionInterest";
import {
  SectionArticles,
  SectionArticleSkeleton,
} from "@/components/SectionArticles";
import { SearchbarSkeleton } from "@/components/Searchbar";

export interface ViewFeedProps {
  userEmail: string;
  userSettings: Database["public"]["Tables"]["user_settings"]["Row"];
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
  queryArticles: QueryArticle[];
  interestArticles: InterestArticles[];
  handleSignOut: () => Promise<void>;
  handleUpdateNotifications: () => Promise<void>;
  handleDeleteInterest: (interestId: string) => Promise<void>;
  handleSaveUserInterest: (query: string) => Promise<string>;
  handleReadUserArticles: (
    articleIds: string[],
    isRead: boolean,
  ) => Promise<void>;
}

export function ViewFeed({
  userEmail,
  userSettings,
  feeds,
  queryArticles,
  interestArticles,
  handleSignOut,
  handleDeleteInterest,
  handleReadUserArticles,
  handleSaveUserInterest,
  handleUpdateNotifications,
}: ViewFeedProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [date] = useState(getCurrentDate());
  const [location, setLocation] = useState("Locating...");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [saving, startSaveTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  const [optimisticInterests, removeOptimisticInterest] = useOptimistic(
    interestArticles,
    (current: InterestArticles[], deletedId: string) =>
      current.filter((interest) => interest.id !== deletedId),
  );

  useEffect(() => {
    getUserLocation().then(setLocation);
  }, []);

  const forminit = new Forminit({ proxyUrl: "/api/forminit" });

  function dismissFeedback() {
    setFeedbackText("");
    setFeedbackOpen(false);
  }

  async function handleFeedbackKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (e.key === "Enter" && !e.shiftKey && feedbackText.trim()) {
      e.preventDefault();
      const formData = new FormData();
      formData.append("fi-sender-email", userEmail);
      formData.append("fi-text-message", feedbackText);
      setFeedbackText("");
      setFeedbackOpen(false);
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
      await forminit.submit("12sccwhqsbm", formData);
    }
  }

  const handleSearch = (query: string) => {
    startSearchTransition(() => {
      router.push(`/feed?query=${encodeURIComponent(query)}`);
    });
  };

  const handleSave = (query: string) => {
    setSaved(false);
    startSaveTransition(async () => {
      await handleSaveUserInterest(query);
      setSaved(true);
      router.push("/feed");
    });
  };

  const handleDelete = (interestId: string) => {
    startDeleteTransition(async () => {
      removeOptimisticInterest(interestId);
      await handleDeleteInterest(interestId);
      router.refresh();
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      router.push("/feed");
    });
  };

  const handleRead = async (articleIds: string[], isRead: boolean) => {
    await handleReadUserArticles(articleIds, isRead);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center">
        <Image
          src={"logo.svg"}
          alt="The Latest Times"
          width={300}
          height={300}
          loading="eager"
          style={{ height: "auto" }}
        />
      </div>
      <Banner location={location} date={date} feeds={feeds} />
      <SearchBar
        onSave={handleSave}
        saving={saving}
        saved={saved}
        onSearch={handleSearch}
        onClear={handleClear}
        searching={isSearching}
      />
      <div className="flex flex-col gap-2">
        {isSearching ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SectionArticleSkeleton key={i} />
            ))}
          </>
        ) : queryArticles.length > 0 ? (
          <SectionArticles articles={queryArticles} />
        ) : (
          <>
            {optimisticInterests.map((interest) => (
              <SectionInterest
                key={interest.id}
                interest={interest}
                deleting={deleting}
                handleDeleteInterest={handleDelete}
                handleReadArticles={handleRead}
              />
            ))}
          </>
        )}
      </div>
      <footer>
        <ul>
          <li>
            <div className="flex justify-between items-center gap-2 border-b border-base-300 py-3">
              <span className="font-semibold truncate min-w-0">
                Email Notifications
              </span>
              <input
                type="checkbox"
                defaultChecked={userSettings.email_notification}
                className="toggle toggle-success"
                onChange={handleUpdateNotifications}
              />
            </div>
          </li>
        </ul>
        {feedbackOpen ? (
          <textarea
            className="textarea w-full rounded-lg"
            placeholder="Feedback (Enter to send)"
            rows={4}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onKeyDown={handleFeedbackKeyDown}
            onBlur={dismissFeedback}
            autoFocus
          />
        ) : (
          <button
            onClick={() => !feedbackSent && setFeedbackOpen(true)}
            className="btn btn-accent justify-start"
            disabled={feedbackSent}
          >
            {feedbackSent ? (
              <>
                <MessageSquareCheck size={14} />
                Message Received
              </>
            ) : (
              <>
                <MessageSquare size={14} />
                Feedback & Support
              </>
            )}
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="btn btn-accent justify-start"
        >
          <LogOut size={14} />
          Sign Out
        </button>
        <div className="flex gap-2 items-center mt-auto">
          <UserRound size={14} />
          <span>{userEmail}</span>
        </div>
      </footer>
    </div>
  );
}

export function ViewFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-8">
      <NavbarSkeleton />
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <SectionArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
