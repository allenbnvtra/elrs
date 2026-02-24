import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/authContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "School LMS",
  description: "Learning management system for schools",
};

const disableDevTools = `
  (function () {
    // Block right-click context menu
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });

    // Block common DevTools keyboard shortcuts
    document.addEventListener('keydown', function (e) {
      // F12
      if (e.key === 'F12') { e.preventDefault(); return; }
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') { e.preventDefault(); return; }
      // Ctrl+Shift+J / Cmd+Option+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') { e.preventDefault(); return; }
      // Ctrl+Shift+C / Cmd+Option+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') { e.preventDefault(); return; }
      // Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); return; }
      // Ctrl+S (save page)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); return; }
    });

    // Detect DevTools open via window size difference
    var threshold = 160;
    function detectDevTools() {
      var widthDiff  = window.outerWidth  - window.innerWidth;
      var heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:1.5rem;color:#333;">Access Denied</div>';
      }
    }

    // Debugger trap — freezes the debugger if opened
    setInterval(function () {
      (function () { debugger; })();
    }, 100);

    setInterval(detectDevTools, 1000);
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: disableDevTools }} />
      </head>
      <body
        className={`${inter.variable} ${firaCode.variable} text-foreground bg-[#f5f5f5] font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}