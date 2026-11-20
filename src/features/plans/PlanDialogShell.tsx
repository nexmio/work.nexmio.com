import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlanStore } from "@/stores/planStore";

export function close(): void {
  usePlanStore.getState().setDialog(null);
}
/** A dialog that closes when asked to (and not before it is done working). */
export function Shell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter className="items-center">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
