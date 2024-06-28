import fs from "fs";
import path from "path";

const getAllPosts = () => {
  const folder = "./posts";
  const files = fs.readdirSync(folder);
  const posts = files.filter((file) => file.endsWith(".mdx"));
  const slugs = posts.map((post) => post.replace(".mdx", ""));
  return slugs;
};

export default getAllPosts;
