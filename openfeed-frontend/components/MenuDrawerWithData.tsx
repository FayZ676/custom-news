import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/data/interests";
import { MenuDrawer } from "@/components/MenuDrawer";

export async function MenuDrawerWithData() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) return null;

  const userId = claimsData.claims.sub;
  const interests = await getUserInterests(userId);

  return <MenuDrawer interests={interests ?? []} />;
}
