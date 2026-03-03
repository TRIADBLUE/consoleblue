import { useTeamUsers, useUpdateUserRole, useDeactivateUser } from "@/hooks/use-team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, UserX, Shield, Mail } from "lucide-react";

export default function TeamPage() {
  const { data, isLoading } = useTeamUsers();
  const updateRole = useUpdateUserRole();
  const deactivate = useDeactivateUser();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const users = data?.users || [];
  const activeUsers = users.filter((u) => u.isActive);
  const inactiveUsers = users.filter((u) => !u.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeUsers.length} active member{activeUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Active Users */}
      <div className="space-y-3 mb-8">
        {activeUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">
                  {user.displayName?.[0]?.toUpperCase() ||
                    user.email[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">
                  {user.displayName || user.email}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={user.role}
                  onValueChange={(role) =>
                    updateRole.mutate({ id: user.id, role })
                  }
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                {user.lastLogin && (
                  <span className="text-xs text-gray-400 hidden md:block">
                    Last login:{" "}
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </span>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <UserX className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Deactivate {user.displayName || user.email}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This user will no longer be able to log in. This can be
                        reversed later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deactivate.mutate(user.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Inactive ({inactiveUsers.length})
          </h2>
          <div className="space-y-2">
            {inactiveUsers.map((user) => (
              <Card key={user.id} className="opacity-60">
                <CardContent className="flex items-center gap-4 py-3 px-5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400">
                      {user.displayName?.[0]?.toUpperCase() ||
                        user.email[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">
                      {user.displayName || user.email}
                    </p>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
