export const metadata = {
  title: "DMS Admin",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function AdminLayout({ children }) {
  return (
    <div className="theme-admin">
      {children}
      <style jsx global>{`
        :root {
          --bg-primary: #f5f7fb;
          --bg-surface: #ffffff;
          --bg-elevated: #eef3fa;
          --border: #dbe4f0;
          --text-primary: #0f172a;
          --text-muted: #64748b;

          --title-color: #0f172a;
          --subtitle-color: #64748b;

          --accent: #2563eb;
          --critical: #dc2626;
          --warning: #f59e0b;
          --safe: #16a34a;
          --info: #0ea5e9;
          --purple: #7c3aed;
          --teal: #0d9488;
          --orange: #ea580c;
        }
      `}</style>
    </div>
  );
}

