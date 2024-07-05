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
import "./style.css";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { app } from "@/app/components/firebase";
import matter from "gray-matter";
import { tenorSans } from "@/app/components/font";

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
  imageUrl: string;
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

export const revalidate = 10;

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

  return (
    <main className="w-screen flex flex-col items-center bg-amber-50 text-black">
      <header className="py-4 px-6 md:px-8 lg:px-10 bg-white head sticky top-0 left-0 w-screen">
        <div className="w-full h-[100%] bg-gradient-to-b from-transparent  to-amber-50 absolute bottom-0 right-0 -z-10"></div>
        <h1 className={`${tenorSans.className} text-3xl z-50 text-black`}>
          ragas
        </h1>
      </header>
      <div className="relative mb-8">
        <Image
          src={data.imageUrl}
          alt={data.title}
          width={700}
          className="w-[] h-[40vh] object-cover  relative"
          height={400}
          loading="eager"
        />
        <h1 className="absolute bottom-0 left-0 w-full h-fit p-3 bg-black font-bold text-2xl text-white">
          {data.title}
        </h1>
      </div>

      <p className="flex italic items-center">
        by{" "}
        {
          // <Image
          //   src={data.authorAvatar}
          //   width={30}
          //   height={30}
          //   alt="Author's avatar"
          //   className="rounded-full mx-2"
          // />
          <Image
            src={
              "https://cdn.hashnode.com/res/hashnode/image/upload/v1624556451478/DbBnjCmyP.jpeg?w=500&h=500&fit=crop&crop=faces&auto=compress,format&format=webp"
            }
            width={30}
            height={30}
            alt="Author's avatar"
            className="rounded-full mx-2"
          />
        }
        {/* {data.author} */}
        jjmachan
      </p>
      <p className="text-slate-500">
        {data.readTime} • {format(new Date(data.date), "dd LLLL yyyy")}
      </p>
      <div className="w-[90%] flex justify-center mb-10">
        <article className="prose md:prose-xl prose-img:bg-amber-50 prose-img:rounded-xl prose-neutral w-full sm:w-[90vw] prose-sm ">
          <div dangerouslySetInnerHTML={{ __html: content1 }} />
        </article>
      </div>
      <Footer />
    </main>
  );
}
