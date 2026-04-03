import { Search } from "lucide-react";
import Link from "next/link";

export default function Fab() {
  return (
    <div className="fab">
      <Link href="/feed" className="btn btn-lg btn-circle btn-accent">
        <Search size={18} strokeWidth={3} />
      </Link>
    </div>
  );
}
