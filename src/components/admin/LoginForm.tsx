import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Icon } from './icon';

const schema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
type FormValues = z.infer<typeof schema>;

// Client-side rate limit: 3s cooldown between attempts, lockout 30s after 5 fails.
const COOLDOWN_MS = 3000;
const MAX_FAILS = 5;
const LOCKOUT_MS = 30_000;

export default function LoginForm({ next }: { next: string }) {
  const [loading, setLoading] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [lockoutUntil, setLockoutUntil] = React.useState<number>(0);
  const [fails, setFails] = React.useState(0);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (cooldown <= 0 && lockoutUntil <= 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setCooldown((c) => (c > 0 ? Math.max(0, c - 1000) : 0));
      if (lockoutUntil > 0 && now >= lockoutUntil) setLockoutUntil(0);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown, lockoutUntil]);

  const isLockedOut = lockoutUntil > Date.now();
  const isCooling = cooldown > 0;
  const disabled = loading || isLockedOut || isCooling;

  async function onSubmit(values: FormValues) {
    if (disabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };

      if (res.status === 429) {
        toast.error('Terlalu banyak percobaan. Tunggu sebentar.');
        setCooldown(60_000);
        return;
      }

      if (!res.ok || !body.ok) {
        // Generic error — no enumeration, no raw message leakage.
        setError('password', { type: 'server', message: 'Email atau kata sandi salah' });
        const newFails = fails + 1;
        setFails(newFails);
        if (newFails >= MAX_FAILS) {
          setLockoutUntil(Date.now() + LOCKOUT_MS);
          toast.error(`Terlalu banyak percobaan. Coba lagi dalam ${LOCKOUT_MS / 1000} detik.`);
        } else {
          setCooldown(COOLDOWN_MS);
        }
        return;
      }

      setFails(0);
      setCooldown(0);
      setLockoutUntil(0);
      toast.success('Selamat datang kembali');
      window.location.assign(next || '/admin');
    } catch {
      toast.error('Gagal terhubung. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Icon name="droplet" className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">Panel Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sedekah Air Minum</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="admin@contoh.com"
            disabled={disabled}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={disabled}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        {isLockedOut && (
          <p className="text-xs text-destructive">
            Akun terkunci sementara. Coba lagi dalam {Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000))}s.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={disabled}>
          {loading ? (
            <Icon name="loader-circle" className="size-4 animate-spin" />
          ) : isCooling ? (
            <span>Tunggu {Math.ceil(cooldown / 1000)}s</span>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>
      <Toaster position="top-center" richColors />
    </div>
  );
}
