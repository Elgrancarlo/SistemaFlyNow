"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/pedidos", label: "Pedidos" },
  { href: "/estoque", label: "Estoque" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            pathname.startsWith(l.href)
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
