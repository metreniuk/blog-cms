export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: string;
  title: string;
  author_id: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: string;
  name: string;
}

export interface PostContent {
  _id: string;
  content: string;
  version: number;
  created_at: Date;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
}