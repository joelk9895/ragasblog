import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { NotionToMarkdown } from "notion-to-md";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import removeMd from "remove-markdown";
import axios from "axios";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
config();

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string
);
const notion = new Client({
  auth: process.env.NEXT_PUBLIC_NOTION_API_KEY as string,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

function calculateReadTime(text: string): string {
  const strippedText = removeMd(text);
  const wordsPerMinute = 200;
  const words = strippedText.split(" ").filter(Boolean).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

async function getSummary(text: string): Promise<string> {
  const strippedText = removeMd(text);
  const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Make it concise under 50 words: " + strippedText;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summaryText = await response.text();

  return summaryText.trim();
}

async function downloadImage(url: string, filePath: string): Promise<void> {
  console.log(`Downloading image from ${url} to ${filePath}`);

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

interface Post {
  id: string;
  properties: {
    title: {
      title: Array<{
        plain_text: string;
      }>;
    };
    slug: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
    Background: {
      files: Array<{
        file: {
          url: string;
        };
        name: string;
      }>;
    };
    date: {
      date: {
        start: string;
      };
    };
    Author: {
      people: Array<{
        name: string;
        avatar_url: string;
      }>;
    };
  };
}

async function fetchPages(databaseId: string): Promise<void> {
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  const posts: Post[] = response.results as unknown as Post[];
  const existingFiles = fs
    .readdirSync("posts")
    .filter((file) => file.endsWith(".mdx"));
  const postSlugs = posts.map(
    (post) => post.properties.slug.rich_text[0].plain_text
  );
  console.log(postSlugs);

  let i = 1;
  for (const post of posts) {
    console.log(post);
    const title = post.properties.title.title[0].plain_text;
    const slug = post.properties.slug.rich_text[0].plain_text;
    const image = post.properties.Background.files[0].file.url;
    const imageFileName = post.properties.Background.files[0].name;
    const date = post.properties.date.date.start;
    const author = post.properties.Author.people[0].name;
    const authorAvatar = post.properties.Author.people[0].avatar_url;
    const mdBlocks = await n2m.pageToMarkdown(post.id);
    const mdString = n2m.toMarkdownString(mdBlocks);
    const readTime = calculateReadTime(mdString.parent);

    const filePath = path.join("posts", `${slug}.mdx`);
    const newContent = mdString.parent;
    const updatedContent = await replaceImageUrlsWithLocalPaths(newContent);

    if (fs.existsSync(filePath)) {
      const existingContent = fs.readFileSync(filePath, "utf-8");
      if (existingContent.includes(newContent)) {
        console.log(
          `Post ${i++} of ${posts.length} is already up to date at ${filePath}`
        );
        continue;
      }
    }
    const imageFilePath = path.join("public/images", imageFileName);
    await downloadImage(image, imageFilePath);
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
    const content = header + updatedContent;

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
async function replaceImageUrlsWithLocalPaths(text: string): Promise<string> {
  const urlRegex = /(https?:\/\/[^\s]+(\.png|\.jpg|\.jpeg|\.gif)[^\s]*)/g;
  const matches = text.match(urlRegex);
  if (!matches) return text;

  let updatedText = text;

  for (const url of matches) {
    const uniqueId = Date.now() + "-" + Math.floor(Math.random() * 1000);
    const extensionRegex = /(\.png|\.jpg|\.jpeg|\.gif)/g;

    const extension = url.match(extensionRegex)![0];
    const fileName = `image-${uniqueId}${extension}`;
    const localPath = path.join("public", "images", fileName);
    const newUrl = url.replace(")", "");
    await downloadImage(newUrl, localPath);

    const relativePath = path.join("/images", fileName);
    console.log(`Replacing ${url} with ${relativePath}`);
    updatedText = updatedText.replace(newUrl, relativePath);
  }

  return updatedText;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    if (process.env.NOTION_DATABASE_ID) {
      await fetchPages(process.env.NOTION_DATABASE_ID);
      const revalidateUrl = new URL("/api/revalidate", req.url);
      revalidateUrl.searchParams.set(
        "secret",
        process.env.REVALIDATION_SECRET as string
      );
      await fetch(revalidateUrl.toString());

      return NextResponse.json({ message: "Success and revalidated" });
    } else {
      return NextResponse.json(
        { message: "Please provide a NOTION_DATABASE_ID in .env file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
