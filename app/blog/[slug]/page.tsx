import { unified } from "unified";
import { Node } from "unist";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import remarkGFM from "remark-gfm";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import "katex/dist/katex.min.css";
import Image from "next/image";
import { format } from "date-fns";
import Footer from "@/app/components/footer";
import { Metadata } from "next";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/app/components/firebase";
import matter from "gray-matter";

// Initialize Firebase
const db = getFirestore(app);

interface PostPageProps {
  params: { slug: string };
}

interface PostData {
  title: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  image: string;
  summary: string;
  fileUrl: string;
}

async function getPostContent(slug: string): Promise<string> {
  const docRef = doc(db, "posts", slug);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as PostData;
    const fileUrl = data.fileUrl;
    const response = await fetch(fileUrl);
    return await response.text();
  } else {
    throw new Error("Post not found");
  }
}

async function cleanContent(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(remarkGFM)
    .use(() => {
      return (tree: Node) => {
        visit(tree, "element", (node: any) => {
          if (
            node.tagName === "a" &&
            node.properties &&
            node.properties.href &&
            (node.properties.href.startsWith("https://www.youtube.com") ||
              node.properties.href.startsWith("https://youtu.be"))
          ) {
            const url = node.properties.href as string;
            let embedUrl: string = "";

            if (url.startsWith("https://www.youtube.com")) {
              embedUrl = url.replace("/watch?v=", "/embed/");
            } else if (url.startsWith("https://youtu.be")) {
              embedUrl = url.replace(
                "https://youtu.be/",
                "https://www.youtube.com/embed/"
              );
            }
            embedUrl += "?modestbranding=1&color=white";

            node.tagName = "iframe";
            node.properties = {
              ...node.properties,
              src: embedUrl,
              width: "560",
              height: "315",
              frameBorder: "0",
              className: "w-full rounded-xl",
              referrerpolicy: "strict-origin-when-cross-origin",
              allow:
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture ",
              allowFullScreen: true,
            };
            node.children = [];
          }
        });
      };
    })
    .use(rehypeStringify)
    .process(content);

  return result.toString();
}

export async function generateStaticParams() {
  const postsCollection = collection(db, "posts");
  const postsSnapshot = await getDocs(postsCollection);
  return postsSnapshot.docs.map((doc) => ({
    slug: doc.id,
  }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = params;
  const docRef = doc(db, "posts", slug);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as PostData;
    return {
      title: data.title,
      description: data.summary,
      authors: [{ name: data.author }],
    };
  } else {
    return {
      title: "Post not found",
      description: "The requested post could not be found.",
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = params;
  const docRef = doc(db, "posts", slug);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return <div>Post not found</div>;
  }

  const data = docSnap.data() as PostData;
  const fileContent = await getPostContent(slug);
  const { content } = matter(fileContent);
  const content1 = await cleanContent(content);
  console.log(content1);

  return (
    <main className="w-screen flex flex-col items-center">
      <Image
        src={data.image}
        alt={data.title}
        width={400}
        className="lg:w-[40%] h-[400px] object-contain md:w-[90vw] md:rounded-xl"
        height={400}
      />
      <p className="flex">
        by{" "}
        {
          <Image
            src={data.authorAvatar}
            width={30}
            height={30}
            alt="Author's avatar"
            className="rounded-full"
          />
        }
        {data.author}
      </p>
      <p className="text-slate-500">
        {data.readTime} • {format(new Date(data.date), "dd LLLL yyyy")}
      </p>
      <div className="w-[90%] flex justify-center mb-10">
        <article className="prose prose-img:bg-white prose-img:rounded-xl prose-invert w-full sm:w-[90vw] sm:prose-sm">
          <div dangerouslySetInnerHTML={{ __html: content1 }} />
        </article>
      </div>
      <Footer />
    </main>
  );
}
