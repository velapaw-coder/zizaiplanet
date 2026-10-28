import { redirect } from "next/navigation";

/** 「我的成长空间」已并入「创造者家园」；保留此路由以免旧链接失效。 */
export default function GrowthPage() {
  redirect("/garden?section=growth");
}
