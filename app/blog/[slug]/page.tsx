import Footer from "@/app/components/footer";
import { tenorSans } from "@/app/page";
import { allPosts } from "contentlayer/generated";
import { format, parseISO } from "date-fns";
import { getMDXComponent } from "next-contentlayer/hooks";
import type { MDXComponents } from "mdx/types";
import { notFound } from "next/navigation";
import "highlight.js/styles/default.css";
import "./style.css";
import hljs from "highlight.js";
import Image from "next/image";

interface PostPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post._raw.flattenedPath,
  }));
}

export default function PostPage({ params }: PostPageProps) {
  const post = allPosts.find((post) => post._raw.flattenedPath === params.slug);

  if (!post) {
    notFound();
  }

  const MDXContent = getMDXComponent(post.body.code);

  const MDXComponents: MDXComponents = {
    a: ({ href, children }) => {
      if (children === "embed" || children === "video") {
        return <iframe src={href} className="w-[50vw] aspect-video"></iframe>;
      } else if (children === "bookmark") {
        return <a href={href}>Link</a>;
      }
      return <a href={href}>{children ?? ""}</a>;
    },
    code: ({ children }) => {
      return (
        <code
          className="hljs rounded-lg"
          dangerouslySetInnerHTML={{
            __html: hljs.highlightAuto(String(children)).value,
          }}
        ></code>
      );
    },
  };

  return (
    <section className="flex flex-col items-center">
      <header className="dark:text-white py-4 px-6 md:px-8 lg:px-10 w-screen">
        <h1 className={`${tenorSans.className} text-3xl`}>ragas</h1>
      </header>
      <div className="w-screen h-screen flex flex-col items-center pt-10">
        <h2 className="text-white font-extrabold text-5xl w-[60vw] mb-5">
          {post.title}
        </h2>
        <div className="flex items-center gap-3 w-[60vw] mb-10">
          <Image
            src={post.authorAvatar}
            width={40}
            height={40}
            alt={post.author + "'s avatar"}
            className="rounded-full aspect-[1/1] object-cover"
          />
          <p className="text-white text-lg">{post.author}</p>
          <small className="text-gray-400 text-lg">
            {format(parseISO(post.date), "LLLL d, yyyy")}
          </small>
        </div>
        <article className="w-[60vw] text-white pb-20">
          <div className="articleContent">
            <MDXContent components={MDXComponents} />
          </div>
        </article>
        <Footer />
      </div>
    </section>
  );
}
