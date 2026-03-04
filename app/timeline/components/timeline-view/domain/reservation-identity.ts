type ReservationIdentitySource = {
  id: string;
  createdAt: string;
};

/**
 * Stable identity key used by UI operations (drag/edit/delete).
 * It intentionally excludes mutable fields like phone number.
 */
export function getReservationEntityKey(
  reservation: ReservationIdentitySource,
) {
  return `${reservation.id}-${reservation.createdAt}`;
}
