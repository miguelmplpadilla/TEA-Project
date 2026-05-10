export type Post = {
  id: string;
  author: string;
  handle: string;
  createdAt: string;
  title: string;
  body: string;
  commentCount: number;
  score: number;
  tags: string[];
};
