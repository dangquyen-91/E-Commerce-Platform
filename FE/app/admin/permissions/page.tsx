"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { permissionService, Permission } from "@/lib/services/permission.service";
import { Shield, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByResource, setPermissionsByResource] = useState<Record<string, Permission[]>>({});
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allPerms, byResource, myPerms] = await Promise.all([
        permissionService.getAllPermissions(),
        permissionService.getPermissionsByResource(),
        permissionService.getMyPermissions(),
      ]);
      
      setPermissions(allPerms);
      setPermissionsByResource(byResource);
      setMyPermissions(myPerms);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      toast.error("Không thể tải danh sách quyền hạn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDefaults = async () => {
    try {
      setIsAssigning(true);
      await permissionService.assignDefaultPermissions();
      toast.success("Đã gán permissions mặc định cho các roles thành công");
      await loadData();
    } catch (error: any) {
      console.error("Failed to assign default permissions:", error);
      toast.error(error.message || "Không thể gán permissions mặc định");
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Quản lý Phân quyền
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Quản lý quyền hạn cho các vai trò trong hệ thống
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleAssignDefaults}
            disabled={isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Gán Permissions Mặc định
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base md:text-lg font-medium">
                Tổng Permissions
              </CardTitle>
              <Shield className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">
                {permissions.length}
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Quyền hạn trong hệ thống
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base md:text-lg font-medium">
                Resources
              </CardTitle>
              <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">
                {Object.keys(permissionsByResource).length}
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Nhóm tài nguyên
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base md:text-lg font-medium">
                Quyền của tôi
              </CardTitle>
              <AlertCircle className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold text-green-600">
                {myPermissions.length}
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                Permissions hiện tại
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="by-resource">Theo Resource</TabsTrigger>
            <TabsTrigger value="my-permissions">Quyền của tôi</TabsTrigger>
          </TabsList>

          {/* All Permissions Tab */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tất cả Permissions</CardTitle>
                <CardDescription>
                  Danh sách đầy đủ các quyền hạn trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission._id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{permission.permissionName}</p>
                          <Badge variant="outline">{permission.permissionKey}</Badge>
                        </div>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <Badge variant="secondary">{permission.resource}</Badge>
                          <Badge variant="secondary">{permission.action}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Resource Tab */}
          <TabsContent value="by-resource" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permissions theo Resource</CardTitle>
                <CardDescription>
                  Nhóm permissions theo từng tài nguyên
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource} className="space-y-3">
                      <h3 className="text-lg font-semibold capitalize">{resource}</h3>
                      <div className="space-y-2 pl-4 border-l-2">
                        {perms.map((permission) => (
                          <div
                            key={permission._id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{permission.permissionName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {permission.permissionKey}
                                </Badge>
                              </div>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Permissions Tab */}
          <TabsContent value="my-permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quyền của tôi</CardTitle>
                <CardDescription>
                  Danh sách quyền hạn mà bạn hiện đang có
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myPermissions.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Bạn chưa có quyền hạn nào được gán.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myPermissions.map((permissionKey) => {
                      const permission = permissions.find((p) => p.permissionKey === permissionKey);
                      return (
                        <div
                          key={permissionKey}
                          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {permission?.permissionName || permissionKey}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {permissionKey}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
