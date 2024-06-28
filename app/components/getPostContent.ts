import fs from "fs";

const getPostContent = (slug: string) => {
  const folder = "./posts";
  const files = fs.readdirSync(folder);
  const posts = files.filter((file) => file.endsWith(".mdx"));
  const slugs = posts.map((post) => post.replace(".mdx", ""));
  const content = fs.readFileSync(`${folder}/${slug}.mdx`, "utf-8");
  return content;
};

export default getPostContent;
