import { handleExplore } from "@/lib/explore";

export async function POST(request: Request) {
  const form = await request.formData();
  return handleExplore(request, form);
}
