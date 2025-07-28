"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Copy,
  Check,
  Clock,
  X,
  UserPlus,
  User,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  createInvite,
  getUserInvites,
  revokeInvite,
  updateUserProfile,
} from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { PasswordSettings } from "@/components/auth/password-settings";
import type { Invite } from "@/lib/types";

export default function SettingsPage() {
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
  });

  const loadUserData = useCallback(async () => {
    try {
      if (!user) {
        toast.error("Please sign in to access settings");
        return;
      }

      if (profile) {
        setProfileForm({
          full_name: profile.full_name || "",
          email: profile.email || "",
        });
      }

      const userInvites = await getUserInvites(user.id);
      setInvites(userInvites);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleCreateInvite = async () => {
    if (!user || !profile || (profile.invites_remaining ?? 0) <= 0) {
      toast.error("No invites remaining");
      return;
    }

    setCreatingInvite(true);
    try {
      const result = await createInvite();

      if (result.success && result.invite_code) {
        toast.success("Invite code created successfully!");
        await refreshProfile(); // Refresh profile to update invites_remaining
        await loadUserData(); // Refresh invites list
      } else {
        toast.error(result.error || "Failed to create invite");
      }
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Failed to create invite");
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Invite code copied to clipboard!");

      // Reset copy state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Failed to copy invite code");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { error } = await revokeInvite(inviteId);

      if (error) {
        toast.error("Failed to revoke invite");
      } else {
        toast.success("Invite revoked successfully");
        await loadUserData(); // Refresh data
      }
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error("Failed to revoke invite");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await updateUserProfile(user.id, {
        full_name: profileForm.full_name,
      });

      if (error) {
        toast.error("Failed to update profile");
      } else {
        toast.success("Profile updated successfully!");
        setEditingProfile(false);
        await refreshProfile(); // Refresh profile data
        await loadUserData(); // Refresh invites
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const getStatusBadge = (invite: Invite) => {
    const now = new Date();
    const isExpired = invite.expires_at < now;

    if (invite.status === "used") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Used
        </Badge>
      );
    }
    if (invite.status === "revoked") {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          Expired
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-blue-100 text-blue-800">
        Active
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Show loading if auth is still loading or if we're loading data
  if (authLoading || loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Only check for user (profile might still be loading)
  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please sign in to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingProfile ? (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileForm.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile} size="sm">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({
                      full_name: profile?.full_name || "",
                      email: profile?.email || "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Name
                  </span>
                  <p className="text-sm">{profile?.full_name || "Not set"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Email
                  </span>
                  <p className="text-sm">{profile?.email || user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Member since
                  </span>
                  <p className="text-sm">
                    {profile
                      ? formatDate(profile.created_at)
                      : "Recently joined"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Password & Security Section */}
      <PasswordSettings userEmail={user?.email || profile?.email} />

      {/* Invite Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Management
          </CardTitle>
          <CardDescription>
            Create and manage invite codes for new users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {profile?.invites_remaining ?? 0}
              </div>
              <div className="text-sm text-blue-600">Invites Left</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {invites.filter((i) => i.status === "used").length}
              </div>
              <div className="text-sm text-green-600">Invites Used</div>
            </div>
          </div>

          {/* Create Invite Button */}
          <Button
            onClick={handleCreateInvite}
            disabled={creatingInvite || (profile?.invites_remaining ?? 0) <= 0}
            className="w-full"
          >
            {creatingInvite ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Invite...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Invite
              </div>
            )}
          </Button>

          {(profile?.invites_remaining ?? 0) <= 0 && (
            <p className="text-sm text-gray-500 text-center">
              You have no invites remaining. Contact support for more invites.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invite History */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Your Invites
            </CardTitle>
            <CardDescription>
              History of invite codes you&apos;ve created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {invite.code}
                      </code>
                      {getStatusBadge(invite)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(invite.created_at)}
                      {invite.used_at && (
                        <span className="ml-2">
                          • Used: {formatDate(invite.used_at)}
                        </span>
                      )}
                      {invite.status === "pending" && (
                        <span className="ml-2">
                          • Expires: {formatDate(invite.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {invite.status === "pending" &&
                      new Date() < invite.expires_at && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(invite.code)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedCode === invite.code ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
