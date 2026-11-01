import AdminPageHeader from "@/components/admin/AdminPageHeader";
import LocationsManager from "@/components/admin/LocationsManager";

export const metadata = {
  title: "Locations",
};

export default function AdminLocationsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Coverage"
        title="Locations"
        description="Manage the cities customers can browse. Only active locations appear in the site header."
      />
      <LocationsManager />
    </div>
  );
}
