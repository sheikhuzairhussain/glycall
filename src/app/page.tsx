"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function HomePage() {
  const trpc = useTRPC();
  const greeting = useQuery(trpc.hello.queryOptions({ text: "uzair" }));

  return <div>{greeting.data?.greeting}</div>;
}
