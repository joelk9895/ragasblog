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

function ArrowRightIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function MenuIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function MountainIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

function SearchIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
