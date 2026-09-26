import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { SimpleAuthProvider } from "@/lib/simple-auth/context";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "JengaAI";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Jenga nyumba yako na msaada wa AI. Makadirio ya gharama, ramani na vifaa kwa soko la Tanzania.",
      },
      { name: "theme-color", content: "#C45A27" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <LanguageProvider>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>
              <SimpleAuthProvider>
                <Outlet />
              </SimpleAuthProvider>
            </AuthProvider>
          </I18nextProvider>
        </LanguageProvider>
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  ),
});
