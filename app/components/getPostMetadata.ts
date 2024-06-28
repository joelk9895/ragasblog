import matter from "gray-matter";
import getPostContent from "./getPostContent";
import { Post } from "../page";

export async function getPostMetadata(post: string) {
  const content = getPostContent(post);
  const { data } = matter(content);
  return data as Post;
}
