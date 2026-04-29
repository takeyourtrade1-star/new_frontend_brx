import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Demo | Ebartex',
  description: 'Benvenuto nella demo di Ebartex',
};

export default function DemoExplanationPage() {
  // Unificato con /login, reindirizziamo gli utenti per mantenere i link validi
  redirect('/login');
}

