import { JSX, SVGProps } from "react";
import { BlogCard } from "./components/blogCard";
import { allPosts, Post } from "contentlayer/generated";
import Footer from "./components/footer";
import { compareDesc } from "date-fns";
import { Tenor_Sans } from "next/font/google";
import "@code-hike/mdx/dist/index.css";

export const tenorSans = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
});

export default function Component() {
  const posts = allPosts.sort((a, b) =>
    compareDesc(new Date(a.date), new Date(b.date))
  );
  return (
    <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-black">
      <header className=" dark:text-white py-4 px-6 md:px-8 lg:px-10">
        <h1 className={`${tenorSans.className} text-3xl`}>ragas</h1>
      </header>
      <main className="container grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8 py-12 ">
        <div className="space-y-8 flex flex-col items-center w-screen">
          {posts.map((post) => (
            <BlogCard
              key={post._id}
              title={post.title}
              summary={post.summary}
              avatar={post.authorAvatar}
              author={post.author}
              date={post.date}
              read={post.readTime}
              url={post.url}
              background={post.image}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
