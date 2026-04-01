import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not delete your account.';
}

export default function AccountDangerZone() {
  const navigate = useNavigate();
  const { deleteAccount, profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      await deleteAccount();
      toast.success('Your account has been deleted.');
      navigate('/signup', { replace: true });
    } catch (error) {
      console.error('[account] Failed to delete account', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-card">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Delete Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete {profile?.email ?? 'this account'} and remove its profile data from LocalKart.
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setDialogOpen(true)}>
          Delete account
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This action permanently removes your LocalKart account and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteAccount()} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
