import { notFound } from 'next/navigation';

/** Public-frontend reindex controls stay closed until Staff capability auth exists. */
export default function AdminReindexPage() {
  notFound();
}
