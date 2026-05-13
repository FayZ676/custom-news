export function ThemeApplier({ theme }: { theme: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var t=${JSON.stringify(theme)};document.documentElement.dataset.theme=t;try{localStorage.setItem('color-theme',t)}catch(e){}})()`,
      }}
    />
  );
}
