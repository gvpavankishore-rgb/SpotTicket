import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SnacksManager from "@/components/admin/SnacksManager";

export const metadata = {
  title: "Snacks",
};

export default function AdminSnacksPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Concessions"
        title="Snacks & Drinks"
        description="Add, edit, and price the snacks customers can buy with their tickets."
      />
      <SnacksManager />
    </div>
  );
}
