import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '@/firebase/index';
import { BlogPost } from '../types';

const BLOG_COLLECTION = 'blog_posts';

const convertToBlogPost = (doc: DocumentSnapshot): BlogPost => {
  const data = doc.data();
  if (!data) throw new Error('Post not found');

  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as BlogPost;
};

export async function getBlogPosts(options?: {
  status?: 'all' | 'published' | 'draft';
  limitNum?: number;
}) {
  const { status = 'all', limitNum } = options || {};

  let q = query(collection(db, BLOG_COLLECTION));

  if (status === 'published') {
    q = query(q, where('status', '==', 'published'));
  } else if (status === 'draft') {
    q = query(q, where('status', '==', 'draft'));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  if (limitNum) {
    q = query(q, limit(limitNum));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToBlogPost);
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const docRef = doc(db, BLOG_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return convertToBlogPost(snap);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const q = query(collection(db, BLOG_COLLECTION), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return convertToBlogPost(snapshot.docs[0]);
}

export async function createBlogPost(
  data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>
): Promise<string> {
  const newDocRef = doc(collection(db, BLOG_COLLECTION));
  const now = Timestamp.now();

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  await setDoc(newDocRef, {
    ...cleanData,
    views: 0,
    createdAt: now,
    updatedAt: now,
  });

  return newDocRef.id;
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<void> {
  const docRef = doc(db, BLOG_COLLECTION, id);
  const existing = await getBlogPostById(id);

  // If coverImage changed, delete old one from storage
  if (updates.coverImage !== undefined && existing && existing.coverImage && existing.coverImage !== updates.coverImage) {
    try {
      await deleteBlogImage(existing.coverImage);
    } catch (error) {
      console.error('Error deleting old cover image:', error);
    }
  }

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  await updateDoc(docRef, {
    ...cleanUpdates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  const post = await getBlogPostById(id);
  if (!post) return;

  if (post.coverImage) {
    try {
      await deleteBlogImage(post.coverImage);
    } catch (error) {
      console.error('Error deleting post image from storage:', error);
    }
  }

  const docRef = doc(db, BLOG_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function incrementPostViews(id: string): Promise<void> {
  const docRef = doc(db, BLOG_COLLECTION, id);
  await updateDoc(docRef, {
    views: increment(1),
  });
}

export async function uploadBlogImage(file: File): Promise<string> {
  const imageId = uuidv4();
  const extension = file.name.split('.').pop();
  const path = `blog/${imageId}.${extension}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

function isFirebaseStorageUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('firebasestorage.googleapis.com');
  } catch {
    return false;
  }
}

export async function deleteBlogImage(imageUrl: string): Promise<void> {
  if (!isFirebaseStorageUrl(imageUrl)) return;

  const url = new URL(imageUrl);
  const pathPart = url.pathname.includes('/o/')
    ? url.pathname.split('/o/')[1]
    : '';
  const objectPathEncoded = pathPart || url.searchParams.get('name') || '';
  const objectPath = decodeURIComponent(objectPathEncoded);

  if (!objectPath) return;

  const storageRef = ref(storage, objectPath);
  await deleteObject(storageRef);
}
