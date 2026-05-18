export const metadata = {
  title: "DMS Admin",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function AdminLayout({ children }) {
  return <div className="theme-admin">{children}</div>;
}
