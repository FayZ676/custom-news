import { ArrowDownUp, BookText } from "lucide-react";

interface ToolbarProps {
  handleReadAllArticles: () => void;
  allRead?: boolean;
}

export default function Toolbar({
  handleReadAllArticles,
  allRead,
}: ToolbarProps) {
  return (
    <div className="ml-auto">
      {/* <div className="dropdown dropdown-end dropdown-hover">
        <div tabIndex={0} role="button" className="btn m-1">
          <ArrowDownUp size={16} strokeWidth={2.5} />
          Sort
        </div>
        <ul
          tabIndex={-1}
          className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2"
        >
          <li>
            <a href="">By Date (Newest First)</a>
          </li>
          <li>
            <a href="">By Relevance</a>
          </li>
        </ul>
      </div> */}
      <div className="dropdown dropdown-end dropdown-hover">
        <div tabIndex={0} role="button" className="btn m-1">
          <BookText size={16} strokeWidth={2.5} />
          Read
        </div>
        <ul
          tabIndex={-1}
          className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2"
        >
          <li>
            <a href="">Read All</a>
          </li>
          <li>
            <a href="">Unread All</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
