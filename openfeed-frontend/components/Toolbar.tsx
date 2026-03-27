interface ToolbarProps {
  handleReadAllArticles: () => void;
  allRead?: boolean;
}

export default function Toolbar({
  handleReadAllArticles,
  allRead,
}: ToolbarProps) {
  return (
    <div>
      <button
        className="btn"
        onClick={handleReadAllArticles}
        disabled={allRead}
      >
        Mark all as read
      </button>
    </div>
  );
}
