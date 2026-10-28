import { dispatchAction } from "@/lib/actions";

export async function POST(request: Request) {
  const form = await request.formData();
  return dispatchAction(request, form);
}
