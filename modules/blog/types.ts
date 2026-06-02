export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // HTML format
  coverImage: string | null;
  status: 'draft' | 'published';
  metaTitle: string;
  metaDescription: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}
