import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ShowsManager from "@/components/admin/ShowsManager";

export const metadata = {
  title: "Shows",
};

export default function AdminShowsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Schedule"
        title="Shows"
        description="Pair a movie with a theatre, then set the date, time, and ticket price."
      />
      <ShowsManager />
    </div>
  );
}
