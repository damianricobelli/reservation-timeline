import { UtensilsCrossedIcon } from "lucide-react";
import { ViewModeSelector } from "./view-mode-selector";

export const Header = () => {
  return (
    <header className="bg-white border border-slate-200 rounded-4xl px-4 md:px-4 py-3 md:py-4 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 md:w-10 md:h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <UtensilsCrossedIcon className="siz-4 md:size-5 text-white" />
          </div>
          <h1 className="text-base md:text-xl font-bold text-slate-900 leading-tight">
            Timeline
          </h1>
        </div>
        <ViewModeSelector />
      </div>
    </header>
  );
};
