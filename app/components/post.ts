import * as fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "posts");

export function getPostIds() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR);
  }

  const fileNames = fs.readdirSync(POSTS_DIR);

  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.mdx$/, ""),
      },
    };
  });
}
