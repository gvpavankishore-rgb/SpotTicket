import AdminPageHeader from "@/components/admin/AdminPageHeader";
import MoviesManager from "@/components/admin/MoviesManager";

export const metadata = {
  title: "Movies",
};

export default function AdminMoviesPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Movies"
        description="Add, edit, and remove the titles available on SpotTicket."
      />
      <MoviesManager />
    </div>
  );
}
