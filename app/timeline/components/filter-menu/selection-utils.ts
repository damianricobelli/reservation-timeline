export function areAllItemsSelected(selectedIds: string[], totalItems: number) {
  if (totalItems === 0) return false;
  return selectedIds.length === 0 || selectedIds.length === totalItems;
}

export function normalizeSelectionForQuery(
  selectedIds: string[],
  allIds: string[],
): string[] {
  if (allIds.length === 0) {
    return [];
  }

  if (selectedIds.length === 0) {
    return [];
  }

  const selectedSet = new Set(selectedIds);
  const normalized = allIds.filter((id) => selectedSet.has(id));

  if (normalized.length === 0 || normalized.length === allIds.length) {
    return [];
  }

  return normalized;
}

export function nextItemSelection(
  selectedIds: string[],
  allIds: string[],
  itemId: string,
  nextChecked: boolean,
) {
  const allSelected = areAllItemsSelected(selectedIds, allIds.length);
  const next = new Set(allSelected ? allIds : selectedIds);

  if (nextChecked) {
    next.add(itemId);
  } else {
    next.delete(itemId);
  }

  if (next.size === 0 || next.size === allIds.length) {
    return [];
  }

  return allIds.filter((id) => next.has(id));
}
