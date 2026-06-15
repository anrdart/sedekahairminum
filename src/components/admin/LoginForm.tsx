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
import { createSupabaseBrowser } from '@/lib/supabase/browser';

const schema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginForm({ next }: { next: string }) {
  const [loading, setLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah' : error.message);
      setLoading(false);
      return;
    }
    toast.success('Selamat datang kembali');
    // Full navigation so middleware re-runs server-side with the new cookies.
    window.location.assign(next || '/admin');
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
          <Input id="email" type="email" autoComplete="email" placeholder="admin@contoh.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Icon name="loader-circle" className="size-4 animate-spin" />}
          Masuk
        </Button>
      </form>
      <Toaster position="top-center" richColors />
    </div>
  );
}
