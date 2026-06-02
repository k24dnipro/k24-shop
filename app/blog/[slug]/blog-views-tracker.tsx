"use client";

import { useEffect } from 'react';
import { auth } from '@/firebase/index';
import { incrementPostViews } from '@/modules/blog/services/blog.service';

interface BlogViewsTrackerProps {
  postId: string;
}

export function BlogViewsTracker({ postId }: BlogViewsTrackerProps) {
  useEffect(() => {
    // Firestore rules only allow updates by authenticated active staff members.
    // We only increment if user is signed in to avoid permission errors on the client.
    if (!auth.currentUser) return;
    
    incrementPostViews(postId).catch((err) => {
      console.warn('Failed to increment blog post views:', err);
    });
  }, [postId]);

  return null;
}
