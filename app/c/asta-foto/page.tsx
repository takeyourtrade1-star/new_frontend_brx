import { GuestPhotoPairingEntry } from '@/components/feature/aste/create/GuestPhotoPairingEntry';

export const metadata = {
  title: 'Carica foto',
  description: 'Invio foto per la tua asta da telefono.',
};

export default function AstaFotoGuestPage() {
  return (
    <GuestPhotoPairingEntry
      context="auction"
      helpText="Apri la pagina dal QR mostrato nel passo Foto della creazione asta sul computer."
    />
  );
}
