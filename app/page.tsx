import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';

export const revalidate = 3600; // ISR

export default async function Home({
  params,
}: {
  params: { id: string };
}) {
  const snap = await getDoc(doc(db, "products", params.id));

  if (!snap.exists()) {
    return <h1>Product not found</h1>;
  }

  const product = snap.data();

  return (
    <main>
      <h1>{product.title}</h1>
      <p>{product.price} $</p>
      <p>{product.description}</p>
    </main>
  );
}
