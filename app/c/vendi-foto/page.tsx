import { GuestPhotoPairingEntry } from '@/components/feature/aste/create/GuestPhotoPairingEntry';

export const metadata = {
  title: 'Carica foto inserzione',
  description: 'Invio foto per la tua inserzione marketplace da telefono.',
};

export default function VendiFotoGuestPage() {
  return (
    <GuestPhotoPairingEntry
      context="listing"
      helpText="Apri la pagina dal QR mostrato nel passo Foto della pubblicazione inserzione sul computer."
    />
  );
}
