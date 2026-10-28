import { redirect } from "next/navigation";

/** Alias kept for old links; product lives on /explore. */
export default function ExploreChatAlias() {
  redirect("/explore");
}
