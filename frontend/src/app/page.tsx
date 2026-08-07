import { Design } from "@/components/ui/demo";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return <Design isAuthenticated={!!session?.user} />;
}
