import { Design } from "@/components/ui/demo";
import { auth } from "@/lib/auth";

export default async function DesignPage() {
  const session = await auth();

  return <Design isAuthenticated={!!session?.user} />;
}
