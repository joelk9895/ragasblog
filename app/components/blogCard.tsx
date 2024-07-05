import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { SVGProps } from "react";

export function BlogCard(props: {
  url: string;
  author: string;
  read: string;
  date: string | number | Date;
  title: string;
  summary?: string;
  avatar?: string;
  background?: string;
}) {
  return (
    <article className="flex lg:flex-row flex-col gap-10 justify-center items-center w-screen pt-5">
      <img
        src={props.background || "/cover.jpg"}
        alt="Blog post cover"
        width={400}
        height={200}
        className="rounded-lg object-cover aspect-[3/2]"
      />
      <div className="space-y-2 w-[40%]">
        <h2 className="text-4xl font-black tracking-tight">{props.title}</h2>
        <p className="text-gray-800 ">
          {props.summary || "No summary provided"}
        </p>
        <div className="flex gap-2 items-center">
          {/* <Image
            src={props.avatar || "/avatar.jpg"}
            width={30}
            height={30}
            alt="Author's avatar"
            className="rounded-full"
          /> */}
          <Image
            src={
              "https://cdn.hashnode.com/res/hashnode/image/upload/v1624556451478/DbBnjCmyP.jpeg?w=500&h=500&fit=crop&crop=faces&auto=compress,format&format=webp"
            }
            width={30}
            height={30}
            alt="Author's avatar"
            className="rounded-full mx-2"
          />
          {/* <p>{props.author}</p> */}
          <p>jjmachan</p>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          {props.read} • {format(new Date(props.date), "dd LLLL yyyy")}
        </p>
        <Link
          href={`/blog/${props.url}`}
          className="inline-flex items-center gap-1 bg-slate-900 px-1 py-2 rounded-md text-yellow-500 hover:text-yellow-600"
          prefetch={true}
        >
          Read more
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
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
