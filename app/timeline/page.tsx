import { Container } from "@/components/container";
import { Header } from "@/components/header";

export default function Page() {
  return (
    <main className="grid grid-rows-[auto_1fr] gap-4 h-[calc(100vh-2rem)]">
      <Header />
      <Container />
    </main>
  );
}
