import AdminPageHeader from "@/components/admin/AdminPageHeader";
import TheatresManager from "@/components/admin/TheatresManager";

export const metadata = {
  title: "Theatres",
};

export default function AdminTheatresPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Venues"
        title="Theatres"
        description="Manage the venues and seat capacity used for screenings."
      />
      <TheatresManager />
    </div>
  );
}
