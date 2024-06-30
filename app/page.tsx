import { Suspense } from "react";
import { BlogCard } from "./components/blogCard";
import Footer from "./components/footer";
import "@code-hike/mdx/dist/index.css";
import { tenorSans } from "./components/font";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "./components/firebase";

export interface Post {
  _id: string;
  title: string;
  summary: string;
  authorAvatar: string;
  author: string;
  date: string;
  readTime: string;
  url: string;
  image: string;
}

const db = getFirestore(app);

async function getPosts() {
  const postsCollection = collection(db, "posts");
  const postsSnapshot = await getDocs(postsCollection);
  return postsSnapshot.docs.map(
    (doc) =>
      ({
        _id: doc.id,
        ...doc.data(),
      } as Post)
  );
}

function PostList({ posts }: { posts: Post[] }) {
  console.log(posts);
  return (
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
          url={post._id}
          background={post.image}
        />
      ))}
    </div>
  );
}
export const revalidate = 10;
export default async function Home() {
  const allPosts = await getPosts();

  return (
    <main className="flex flex-col min-h-[100dvh] bg-black">
      <header className="dark:text-white py-4 px-6 md:px-8 lg:px-10">
        <h1 className={`${tenorSans.className} text-3xl`}>ragas</h1>
      </header>
      <main className="container grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8 py-12 min-h-[80vh]">
        <Suspense fallback={<div>Loading posts...</div>}>
          <PostList posts={allPosts} />
        </Suspense>
      </main>
      <Footer />
    </main>
  );
}
