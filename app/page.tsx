import { Button } from "@/components/ui/button";
import { createSeedData } from "@/data/create-seed-data";
import Link from "next/link";

export default function Page() {
  console.log(createSeedData(10));
  return (
    <main className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Reservation Timeline</h1>
      <Button nativeButton={false} render={<Link href="/timeline" />}>
        Open App
      </Button>
    </main>
  );
}
