export function ThemeApplier({ theme }: { theme: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.dataset.theme=${JSON.stringify(theme)}`,
      }}
    />
  );
}
