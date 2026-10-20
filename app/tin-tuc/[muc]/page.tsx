import { notFound } from "next/navigation";
import NewsPage from "@/components/NewsPage";
import { NEWS_CATEGORIES } from "@/lib/news";

// Tự động lấy tin mới mỗi giờ (giữ bằng NEWS_REVALIDATE_SECONDS trong lib/news.ts).
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS_CATEGORIES.filter((c) => c.slug !== "tat-ca").map((c) => ({ muc: c.slug }));
}

function findCategory(slug: string) {
  return NEWS_CATEGORIES.find((c) => c.slug === slug && c.slug !== "tat-ca");
}

export async function generateMetadata({ params }: { params: Promise<{ muc: string }> }) {
  const category = findCategory((await params).muc);
  return { title: category ? `Tin tức – ${category.label}` : "Tin tức" };
}

export default async function NewsCategoryPage({ params }: { params: Promise<{ muc: string }> }) {
  const category = findCategory((await params).muc);
  if (!category) notFound();
  return <NewsPage category={category} />;
}
