import { tenorSans } from "../layout";

export default function Footer() {
  return (
    <footer className="w-screen bg-black text-white flex md:flex-row flex-col-reverse justify-between px-10 py-7 gap-5 items-center border-t-[0.5px] border-slate-500">
      <div className="flex flex-col items-center">
        <a href="mailto:founders@explodinggradients.com">
          founders@explodinggradients.com
        </a>
      </div>
      <div className="flex gap-5 items-center">
        <a href="https://twitter.com/ragas_io">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            className="w-6 h-6"
          >
            <path
              fill="currentColor"
              d="M9.294 6.928L14.357 1h-1.2L8.762 6.147L5.25 1H1.2l5.31 7.784L1.2 15h1.2l4.642-5.436L10.751 15h4.05zM7.651 8.852l-.538-.775L2.832 1.91h1.843l3.454 4.977l.538.775l4.491 6.47h-1.843z"
            ></path>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/ragas-io">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 25"
            className="w-8 h-8"
          >
            <path
              fill="currentColor"
              d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"
            ></path>
          </svg>
        </a>
      </div>
    </footer>
  );
}
