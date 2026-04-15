import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elite Aromas | Perfumes Importados Originais",
  description:
    "Elite Aromas: perfumes importados originais, curadoria premium e atendimento oficial via WhatsApp.",
  applicationName: "Elite Aromas",
  metadataBase: new URL("https://elitearomas.vercel.app")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
