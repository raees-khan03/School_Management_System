import ViewButton from "@/components/ViewButton";
import FormModal from "@/components/FormModal";
import ResetPasswordButton from "@/components/ResetPasswordButton";

type Table = "teacher" | "student" | "parent";

type Props = {
  table: Table;
  item: any; // teacher / student / parent row
};

/**
 * Admin ke liye ek jagah saare row actions:
 * View, Reset password, Edit, Delete.
 * Teachers, students aur parents teeno list pages isi ko use kar sakte hain.
 */
export default function UserRowActions({ table, item }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <ViewButton href={`/list/${table}s/${item.id}`} />
      <ResetPasswordButton
        id={item.id}
        name={`${item.name} ${item.surname}`}
        table={table}
      />
      <FormModal table={table} type="update" data={item} id={item.id} />
      <FormModal table={table} type="delete" id={item.id} />
    </div>
  );
}