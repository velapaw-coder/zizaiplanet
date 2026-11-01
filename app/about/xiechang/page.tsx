import type { Metadata } from "next";
import { XiechangProfile } from "@/components/xiechang-profile";
import { pageMeta } from "@/lib/seo";
import "./xiechang.css";

export const metadata: Metadata = pageMeta({
  title: "谢昌 · AI自由创造",
  description:
    "谢昌，自在星球发起人，独立商业创造者。从真实商业出发发现机会，用 AI 构建产品与商业系统，并与伙伴一起做真实验证。",
  path: "/about/xiechang",
});

export default function XiechangPage() {
  return <XiechangProfile />;
}
