import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { NotionToMarkdown } from "notion-to-md";
import { GoogleGenerativeAI } from "@google/generative-ai";
import removeMd from "remove-markdown";
import axios from "axios";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "../../components/firebase";
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

async function downloadImage(url: string, filename: string): Promise<string> {
  console.log(`Downloading image from ${url}`);

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
    });

    const contentType = response.headers["content-type"];
    const buffer = Buffer.from(response.data, "binary");

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: contentType,
    });

    console.log(`Image stored in blob storage: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error("Error downloading and storing image:", error);
    throw error;
  }
}

const storage = getStorage(app);
const db = getFirestore(app);

async function uploadToFirebaseStorage(
  content: string,
  filename: string
): Promise<string> {
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, Buffer.from(content));
  return await getDownloadURL(storageRef);
}

async function saveToFirestore(slug: string, data: any): Promise<void> {
  await setDoc(doc(db, "posts", slug), data);
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

    const newContent = mdString.parent;
    const updatedContent = await replaceImageUrlsWithLocalPaths(newContent);

    const summary = await getSummary(newContent);
    const header = `---
title: "${title}"
date: ${date}
author: "${author}"
summary: "${summary}"
image: "${image}"
authorAvatar: "${authorAvatar}"
readTime: "${readTime}"
---
`;
    const content = header + updatedContent;

    // Upload content to Firebase Storage
    const fileUrl = await uploadToFirebaseStorage(content, `${slug}.mdx`);

    // Save metadata to Firestore
    await saveToFirestore(slug, {
      title,
      date,
      author,
      summary,
      image,
      authorAvatar,
      readTime,
      fileUrl,
    });

    console.log(
      `Post ${i++} of ${
        posts.length
      } has been created in Firebase Storage and Firestore: ${fileUrl}`
    );
  }
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
    const newUrl = url.replace(")", "");
    const relativePath = await downloadImage(newUrl, fileName);

    console.log(`Replacing ${url} with ${relativePath}`);
    updatedText = updatedText.replace(newUrl, relativePath);
  }

  return updatedText;
}
export const maxDuration = 60;
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
