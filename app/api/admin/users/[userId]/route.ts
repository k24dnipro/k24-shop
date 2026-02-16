import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import type { UserPermissions } from '@/lib/types';

const USERS_COLLECTION = 'users';

/**
 * DELETE /api/admin/users/[userId]
 * Deletes user from Firebase Auth and Firestore so the email can be used again.
 * Caller must be authenticated and have canManageUsers permission.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const authHeader = _request.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    let callerUid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      callerUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (callerUid === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    const callerDoc = await db.collection(USERS_COLLECTION).doc(callerUid).get();
    if (!callerDoc.exists) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 });
    }
    const permissions = callerDoc.data()?.permissions as UserPermissions | undefined;
    if (!permissions?.canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminAuth.deleteUser(userId);

    await db.collection(USERS_COLLECTION).doc(userId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('user-not-found') || message.includes('User not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete user', details: message },
      { status: 500 }
    );
  }
}
