import fs from "fs";
import path from "path";
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
import getPostContent from "@/app/components/getPostContent";
import matter from "gray-matter";
import Image from "next/image";
import { format } from "date-fns";
import Footer from "@/app/components/footer";

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
}

async function cleanContent(slug: string): Promise<string> {
  const fileContent = getPostContent(slug);
  const { content } = matter(fileContent);

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
  const folder = path.join(process.cwd(), "posts");
  const files = fs.readdirSync(folder);
  const posts = files.filter((file) => file.endsWith(".mdx"));
  const slugs = posts.map((post) => post.replace(".mdx", ""));
  return slugs.map((slug) => ({ slug }));
}

export const revalidate = 10;

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = params;
  const content = await cleanContent(slug);
  const fileContent = getPostContent(slug);
  const { data } = matter(fileContent) as unknown as { data: PostData };
  console.log(data);

  return (
    <main className="w-screen flex flex-col items-center">
      <Image
        src={"/images" + data.image}
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
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </div>
      <Footer />
    </main>
  );
}
