import { JSX, SVGProps } from "react";
import { BlogCard } from "./components/blogCard";
import Footer from "./components/footer";
import { compareDesc } from "date-fns";
import { Tenor_Sans } from "next/font/google";
import "@code-hike/mdx/dist/index.css";
import getAllPosts from "./components/getAllPosts";
import { getPostMetadata } from "./components/getPostMetadata";

export const tenorSans = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
});

export interface Post {
  _id: string;
  title: string;
  summary: string;
  authorAvatar: string;
  author: string;
  date: string; // assuming date is a string from Gray Matter
  readTime: string;
  url: string;
  image: string;
}

export default function Component() {
  const allPosts = getAllPosts();
  console.log(allPosts);

  return (
    <main className="flex flex-col min-h-[100dvh] bg-black">
      <header className="dark:text-white py-4 px-6 md:px-8 lg:px-10">
        <h1 className={`${tenorSans.className} text-3xl`}>ragas</h1>
      </header>
      <main className="container grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8 py-12 min-h-[80vh]">
        <div className="space-y-8 flex flex-col items-center w-screen">
          {allPosts.map(async (post) => {
            const data: Post = await getPostMetadata(post);
            return (
              <BlogCard
                key={data._id}
                title={data.title}
                summary={data.summary}
                avatar={data.authorAvatar}
                author={data.author}
                date={data.date}
                read={data.readTime}
                url={post}
                background={data.image}
              />
            );
          })}
        </div>
      </main>
      <Footer />
    </main>
  );
}
