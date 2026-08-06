import { Logo, Wordmark } from "./logo";

export function SplashScreen({ tagline }: { tagline?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-6 dark:bg-dark-bg">
      <div className="flex flex-col items-center gap-4 animate-bloom">
        <Logo size={64} className="animate-breathe [animation-duration:2.4s]" />
        <Wordmark />
        {tagline && (
          <p className="max-w-[220px] text-center text-[14px] leading-relaxed text-teal/50 dark:text-dark-text/50">
            {tagline}
          </p>
        )}
      </div>
      <div className="mt-10 flex gap-1.5">
        <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-sage [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-sage [animation-delay:200ms]" />
        <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-sage [animation-delay:400ms]" />
      </div>
    </div>
  );
}
