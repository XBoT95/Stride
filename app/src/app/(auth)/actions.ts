'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  const { error } = await AuthService.signIn({ email, password });

  if (error) {
    return { error };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signupAction(_prevState: unknown, formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please provide email and password.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const { error } = await AuthService.signUp({ email, password, fullName });

  if (error) {
    return { error };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logoutAction() {
  await AuthService.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
