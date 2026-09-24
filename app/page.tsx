import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className=""
          src="/hackyeah-logo.svg"
          alt="HackYeah logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-5xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Hackathon{" "}
            <code className="rounded bg-black/[.06] px-3 py-0.5 mx-2 font-mono text-5xl dark:bg-white/[.08] border border-black/[.08] dark:border-white/[.145]">
              2026
            </code>{" "}
            ⌨️
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            GitHub repo:{" "}
            <a
              href="https://github.com/JKosk88/hackathon-2026"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              JKosk88/hackathon-2026
            </a>
          </p>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Vercel project:{" "}
            <a
              href="https://vercel.com/jakuns-projects/hackathon-2026"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              jakuns-projects/hackathon-2026
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <div className="relative group">
            <div className="bg-yellow-500 text-black w-full h-12 absolute top-0 transform group-hover:-translate-y-1/2 rounded-t-[24px] rounded-b-[24px] group-hover:rounded-b-[0px] transition-all duration-300 group-hover:shadow-[0_0_10px_5px_rgb(255_94_0)] flex justify-center">
              <span>Recommended</span>
            </div>
            <div className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px] relative">
              Contribute 😎
            </div>
          </div>
          <div className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">
            Slack 😴
          </div>
        </div>
      </main>
    </div>
  );
}
