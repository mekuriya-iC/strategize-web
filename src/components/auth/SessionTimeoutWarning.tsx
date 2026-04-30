"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Clock } from "lucide-react";
import { refreshAccessToken, getRefreshToken } from "@/lib/auth-utils";
import { toast } from "sonner";

export function SessionTimeoutWarning() {
  const { isAuthenticated, tokenExpiresIn, logout } = useAuthContext();
  const [showWarning, setShowWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !tokenExpiresIn) {
      setShowWarning(false);
      return;
    }

    // Only show warning if:
    // 1. Less than 3 minutes remaining (very urgent)
    // 2. AND we have a refresh token (so user can extend)
    // This means automatic refresh likely failed, so we give user manual option
    const hasRefreshToken = !!getRefreshToken();
    const shouldWarn = 
      hasRefreshToken &&
      tokenExpiresIn.includes("minute") && 
      parseInt(tokenExpiresIn) <= 3 &&
      parseInt(tokenExpiresIn) > 0;

    setShowWarning(shouldWarn);
  }, [isAuthenticated, tokenExpiresIn]);

  const handleExtendSession = async () => {
    setIsRefreshing(true);
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        toast.success("Session extended successfully");
        setShowWarning(false);
      } else {
        toast.error("Failed to extend session. Please log in again.");
        logout();
      }
    } catch (error) {
      toast.error("Failed to extend session. Please log in again.");
      logout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your session will expire in{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {tokenExpiresIn}
            </span>
            . Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Automatic session refresh failed. Click "Extend Session" to stay logged in.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleExtendSession}
            disabled={isRefreshing}
            className="w-full sm:w-auto bg-[#3838EC] hover:bg-[#2d2dbd] text-white"
          >
            {isRefreshing ? "Extending..." : "Extend Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
