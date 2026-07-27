import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/** Jet-black, arrow-only top bar used on every page except the landing page. */
export function TopBar() {
  return (
    <header className="bg-hero text-hero-foreground sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center">
        <Link
          to="/"
          aria-label="Back to opportunities"
          className="inline-flex items-center text-white hover:opacity-80 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
