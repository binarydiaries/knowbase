import { useUser } from '@clerk/clerk-react';
import { client } from '@/services/client.gen.ts';
import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Switch } from '@knowbase/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@knowbase/ui/components/table';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { isAdminEmail } from '@/utils/adminAccess';

type FlagRow = {
  flag: string;
  description: string | null;
  globalEnabled: boolean;
  orgOverrideCount: number;
  createdAt: string;
  updatedAt: string;
};

type OrgOverrideRow = {
  orgId: string;
  flag: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute('/admin/feature-flags/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const email = user?.primaryEmailAddress?.emailAddress;
  const canAccessAdmin = isAdminEmail(email);

  const [managingFlag, setManagingFlag] = useState<FlagRow | null>(null);
  const [newOrgId, setNewOrgId] = useState('');
  const [newOrgEnabled, setNewOrgEnabled] = useState(true);
  const [createFlag, setCreateFlag] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDeleteFlag, setConfirmDeleteFlag] = useState<string | null>(null);

  const flagsQuery = useQuery<FlagRow[]>({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const { data } = await client.get<FlagRow[]>({ url: '/admin/feature-flags', responseType: 'json' });
      return data!;
    },
    enabled: canAccessAdmin,
  });

  const orgsQuery = useQuery<OrgOverrideRow[]>({
    queryKey: ['admin-feature-flags-orgs', managingFlag?.flag],
    queryFn: async () => {
      const { data } = await client.get<OrgOverrideRow[]>({
        url: `/admin/feature-flags/${managingFlag!.flag}/orgs`,
        responseType: 'json',
      });
      return data!;
    },
    enabled: !!managingFlag,
  });

  const setGlobalMutation = useMutation({
    mutationFn: ({ flag, globalEnabled }: { flag: string; globalEnabled: boolean }) =>
      client.put({ url: `/admin/feature-flags/${flag}`, body: { globalEnabled }, responseType: 'json' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update flag');
    },
  });

  const createFlagMutation = useMutation({
    mutationFn: ({ flag, description }: { flag: string; description: string }) =>
      client.put({ url: `/admin/feature-flags/${flag}`, body: { globalEnabled: false, description }, responseType: 'json' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setCreateFlag('');
      setCreateDescription('');
      setShowCreateForm(false);
      toast.success('Feature flag created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create flag');
    },
  });

  const deleteFlagMutation = useMutation({
    mutationFn: (flag: string) =>
      client.delete({ url: `/admin/feature-flags/${flag}` }),
    onSuccess: (_, flag) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setConfirmDeleteFlag(null);
      toast.success(`Flag "${flag}" deleted`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete flag');
    },
  });

  const addOrgMutation = useMutation({
    mutationFn: ({ flag, orgIds, enabled }: { flag: string; orgIds: string[]; enabled: boolean }) =>
      client.put({ url: `/admin/feature-flags/${flag}/orgs`, body: { orgIds, enabled }, responseType: 'json' }),
    onSuccess: (_, { flag }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags-orgs', flag] });
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setNewOrgId('');
      toast.success('Org override saved');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save override');
    },
  });

  const removeOrgMutation = useMutation({
    mutationFn: ({ flag, orgId }: { flag: string; orgId: string }) =>
      client.delete({ url: `/admin/feature-flags/${flag}/orgs/${orgId}` }),
    onSuccess: (_, { flag }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags-orgs', flag] });
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      toast.success('Org override removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove override');
    },
  });

  const flags = flagsQuery.data ?? [];

  function handleAddOrg() {
    const trimmed = newOrgId.trim();
    if (!trimmed || !managingFlag) return;
    const orgIds = trimmed.split(/[\s,]+/).filter(Boolean);
    addOrgMutation.mutate({ flag: managingFlag.flag, orgIds, enabled: newOrgEnabled });
  }

  function handleReleaseToAll() {
    if (!managingFlag) return;
    setGlobalMutation.mutate({ flag: managingFlag.flag, globalEnabled: true });
    setManagingFlag((prev) => prev ? { ...prev, globalEnabled: true } : prev);
    toast.success(`${managingFlag.flag} released to all orgs`);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium flex-1">Feature Flags</h1>
        </div>
        <div className="px-4">
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="size-3.5" />
            New Flag
          </Button>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        {!canAccessAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Forbidden</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This page is only available to configured admin accounts.
            </CardContent>
          </Card>
        ) : (
          <>
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">New Feature Flag</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex gap-3 items-end">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Label htmlFor="create-flag">Flag key</Label>
                      <Input
                        id="create-flag"
                        placeholder="e.g. slack, lead_generation"
                        value={createFlag}
                        onChange={(e) => setCreateFlag(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <Label htmlFor="create-desc">Description</Label>
                      <Input
                        id="create-desc"
                        placeholder="What does this flag control?"
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                      />
                    </div>
                    <Button
                      disabled={!createFlag.trim() || createFlagMutation.isPending}
                      onClick={() => createFlagMutation.mutate({ flag: createFlag.trim(), description: createDescription.trim() })}
                    >
                      {createFlagMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Create
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  Feature Flags
                  {flagsQuery.isFetching && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Loading…</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {flagsQuery.error ? (
                  <p className="p-4 text-sm text-destructive">Failed to load flags.</p>
                ) : flags.length === 0 && !flagsQuery.isFetching ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No flags defined yet. Create your first flag above.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Flag</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Global default</TableHead>
                          <TableHead>Org overrides</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flags.map((flag) => (
                          <TableRow key={flag.flag}>
                            <TableCell className="font-mono text-xs font-medium">
                              {flag.flag}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {flag.description ?? '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={flag.globalEnabled}
                                  disabled={setGlobalMutation.isPending}
                                  onCheckedChange={(checked) =>
                                    setGlobalMutation.mutate({ flag: flag.flag, globalEnabled: checked })
                                  }
                                />
                                <span className="text-xs text-muted-foreground">
                                  {flag.globalEnabled ? 'On for all' : 'Off by default'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {flag.orgOverrideCount > 0 ? (
                                <Badge variant="secondary">{flag.orgOverrideCount} orgs</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {confirmDeleteFlag === flag.flag ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-xs text-muted-foreground">Delete flag?</span>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={deleteFlagMutation.isPending}
                                    onClick={() => deleteFlagMutation.mutate(flag.flag)}
                                  >
                                    {deleteFlagMutation.isPending ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : null}
                                    Yes, delete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setConfirmDeleteFlag(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setManagingFlag(flag)}
                                  >
                                    Manage Orgs
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setConfirmDeleteFlag(flag.flag)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Per-org override dialog */}
      <Dialog open={!!managingFlag} onOpenChange={(open) => { if (!open) setManagingFlag(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Org Overrides — <span className="font-mono text-sm">{managingFlag?.flag}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Global status banner */}
            <div className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <div>
                <span className="font-medium">Global default: </span>
                <Badge variant={managingFlag?.globalEnabled ? 'default' : 'secondary'}>
                  {managingFlag?.globalEnabled ? 'Enabled for all' : 'Disabled by default'}
                </Badge>
              </div>
              {!managingFlag?.globalEnabled && (
                <Button
                  size="sm"
                  onClick={handleReleaseToAll}
                  disabled={setGlobalMutation.isPending}
                >
                  Release to All
                </Button>
              )}
            </div>

            {/* Add org override */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Add org override</Label>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="org_abc123 (paste one or multiple, comma/space separated)"
                  value={newOrgId}
                  onChange={(e) => setNewOrgId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddOrg(); }}
                  className="flex-1"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={newOrgEnabled}
                    onCheckedChange={setNewOrgEnabled}
                  />
                  <span className="text-xs w-14">{newOrgEnabled ? 'Enable' : 'Disable'}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!newOrgId.trim() || addOrgMutation.isPending}
                  onClick={handleAddOrg}
                >
                  {addOrgMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Add
                </Button>
              </div>
            </div>

            {/* Existing overrides */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">
                Current overrides
                {orgsQuery.isFetching && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Loading…</span>
                )}
              </Label>
              {orgsQuery.error ? (
                <p className="text-sm text-destructive">Failed to load overrides.</p>
              ) : (orgsQuery.data ?? []).length === 0 && !orgsQuery.isFetching ? (
                <p className="text-sm text-muted-foreground">No org-specific overrides.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Org ID</TableHead>
                        <TableHead>Override</TableHead>
                        <TableHead className="text-right">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orgsQuery.data ?? []).map((row) => (
                        <TableRow key={row.orgId}>
                          <TableCell className="font-mono text-xs">{row.orgId}</TableCell>
                          <TableCell>
                            <Badge variant={row.enabled ? 'default' : 'secondary'}>
                              {row.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              disabled={removeOrgMutation.isPending}
                              onClick={() =>
                                removeOrgMutation.mutate({
                                  flag: managingFlag!.flag,
                                  orgId: row.orgId,
                                })
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
