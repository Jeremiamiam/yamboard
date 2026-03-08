import { redirect } from "next/navigation";
import { CLIENTS } from "@/lib/mock";

export default function Home() {
  redirect(`/${CLIENTS[0].id}`);
}
