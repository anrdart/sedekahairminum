import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Icon } from './icon';
import { absoluteTime } from './format';
import type { Role } from '@/lib/supabase/types';

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

const roleBadge: Record<Role, string> = {
  owner: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  admin: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  editor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const roleLabel: Record<Role, string> = {
  owner: 'Owner', admin: 'Admin', editor: 'Editor',
};

export default function UsersManager({ initial, currentUserId }: { initial: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = React.useState(initial);
  const [showAdd, setShowAdd] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [newRole, setNewRole] = React.useState<Role>('editor');
  const [adding, setAdding] = React.useState(false);

  async function addUser() {
    if (!email || !password || password.length < 6) {
      toast.error('Email dan password (min 6 karakter) wajib diisi');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role: newRole }),
      });
      const body = (await res.json()) as { ok: boolean; user?: UserRow; error?: string };
      if (!body.ok) { toast.error(body.error ?? 'Gagal'); setAdding(false); return; }
      if (body.user) setUsers((prev) => [...prev, body.user!]);
      toast.success('User ditambahkan');
      setShowAdd(false);
      setEmail(''); setPassword(''); setFullName(''); setNewRole('editor');
    } catch { toast.error('Gagal menambah user'); }
    setAdding(false);
  }

  async function changeRole(userId: string, role: Role) {
    const res = await fetch('/api/users/update-role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    });
    const body = (await res.json()) as { ok: boolean; error?: string };
    if (!body.ok) { toast.error(body.error ?? 'Gagal'); return; }
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    toast.success('Role diperbarui');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pengguna</h1>
          <p className="text-sm text-muted-foreground">Kelola akses admin dashboard.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icon name="user-plus" /> Tambah User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-32">Role</TableHead>
              <TableHead className="w-44">Terdaftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {u.role === 'owner' || u.id === currentUserId ? (
                    <Badge variant="outline" className={roleBadge[u.role]}>{roleLabel[u.role]}</Badge>
                  ) : (
                    <Select value={u.role} onValueChange={(v: string | null) => { if (v) changeRole(u.id, v as Role); }}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{absoluteTime(u.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lengkap</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama penulis" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={newRole} onValueChange={(v: string | null) => { if (v) setNewRole(v as Role); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor (penulis blog/artikel)</SelectItem>
                  <SelectItem value="admin">Admin (kelola semua)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={addUser} disabled={adding}>
                {adding && <Icon name="loader-circle" className="animate-spin" />}
                Tambah
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" richColors />
    </div>
  );
}
