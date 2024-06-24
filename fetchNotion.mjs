import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { NotionToMarkdown } from "notion-to-md";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import removeMd from "remove-markdown";
import axios from "axios";

config();
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
const notion = new Client({
  auth: process.env.NEXT_PUBLIC_NOTION_API_KEY,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

function calculateReadTime(text) {
  const strippedText = removeMd(text);
  const wordsPerMinute = 200;
  const words = strippedText.split(" ").filter(Boolean).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return `${minutes} min read`;
}

async function getSummary(text) {
  const strippedText = removeMd(text);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Make it concise under 50 words: " + strippedText;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summaryText = await response.text();

  return summaryText.trim();
}

async function downloadImage(url, filePath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function fetchPages(databaseId) {
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  const posts = response.results;
  const existingFiles = fs
    .readdirSync("posts")
    .filter((file) => file.endsWith(".mdx"));
  const postSlugs = posts.map(
    (post) => post.properties.slug.rich_text[0].plain_text
  );
  console.log(postSlugs);

  let i = 1;
  for (const post of posts) {
    const title = post.properties.title.title[0].plain_text
      .replace(/'/g, "&apos;")
      .replace(/"/g, "&quot;");
    const slug = post.properties.slug.rich_text[0].plain_text;
    const image = post.properties.Background.files[0].file.url;
    const imageFileName = post.properties.Background.files[0].name
      .replace(/'/g, "&apos;")
      .replace(/"/g, "&quot;");
    const date = post.properties.date.date.start;
    const author = post.properties.Author.people[0].name
      .replace(/'/g, "&apos;")
      .replace(/"/g, "&quot;");
    const authorAvatar = post.properties.Author.people[0].avatar_url;
    const mdBlocks = await n2m.pageToMarkdown(post.id);
    const mdString = n2m.toMarkdownString(mdBlocks);
    const readTime = calculateReadTime(mdString.parent);

    const filePath = path.join("posts", `${slug}.mdx`);
    const newContent = mdString.parent
      .replace(/'/g, "&apos;")
      .replace(/"/g, "&quot;");
    console.log(`newContent: ${newContent}`);

    // Check if the file already exists and if the content is the same
    if (fs.existsSync(filePath)) {
      const existingContent = fs.readFileSync(filePath, "utf-8");
      if (existingContent.includes(newContent)) {
        console.log(
          `Post ${i++} of ${posts.length} is already up to date at ${filePath}`
        );
        continue;
      }
    }

    // Download and save the image
    const imageFilePath = path.join("public/images", imageFileName);
    await downloadImage(image, imageFilePath);

    // Generate summary if content is not up-to-date
    const summary = await getSummary(newContent);

    const header = `---
title: "${title}"
date: ${date}
author: "${author}"
summary: "${summary}"
image: "/${imageFileName}"
authorAvatar: "${authorAvatar}"
readTime: "${readTime}"
---
`;
    const content = header + newContent;

    fs.writeFileSync(filePath, content);
    console.log(
      `Post ${i++} of ${posts.length} has been created at ${filePath}`
    );
  }

  // Delete local files that are no longer present in Notion
  existingFiles.forEach((file) => {
    const slug = file.replace(".mdx", "");
    if (!postSlugs.includes(slug)) {
      fs.unlinkSync(path.join("posts", file));
      console.log(`Deleted post: ${file}`);
    }
  });
}

if (process.env.NOTION_DATABASE_ID) {
  fetchPages(process.env.NOTION_DATABASE_ID);
} else {
  console.log("Please provide a NOTION_DATABASE_ID in .env file");
}
