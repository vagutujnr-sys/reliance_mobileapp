import { isRemote } from "@/lib/config";
import { requireProfile } from "@/lib/auth/session";
import { getSettings } from "@/lib/server/admin-service";
import { SettingsForm } from "@/components/admin/OpsForms";

export default async function SettingsPage() {
  const profile = await requireProfile(["super_admin", "admin"]);
  const data = await getSettings(profile.id);
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Settings</h1>
      <p className="mb-4 text-sm text-muted">{isRemote() ? "Connected to Supabase." : "Running the local demonstration dataset. Add Supabase keys and set RMS_DATA_SOURCE=supabase after applying the migration."}</p>
      <SettingsForm supportPhone={data.settings.supportPhone} supportEmail={data.settings.supportEmail} paymentInstructions={data.settings.paymentInstructions} superAdmin={data.superAdmin} />
    </div>
  );
}
