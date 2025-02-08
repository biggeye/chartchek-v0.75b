import Hero from "@/components/hero";
import AuthButton from "@/components/header-auth";

export default async function Home() {
  return (
    <>
  
      <main className="flex-1 flex flex-col gap-6 px-4">
      <Hero />
      </main>
    </>
  );
}
