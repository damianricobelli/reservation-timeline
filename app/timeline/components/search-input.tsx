"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import { SearchIcon } from "lucide-react";
import { useQueryState } from "nuqs";

export const SearchInput = () => {
  const [search, setSearch] = useTimelineQueryState("searchInput", {
    defaultValue: "",
  });

  return (
    <InputGroup className="sm:max-w-56">
      <InputGroupInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
};
