import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAccessTokenServer() {
  const session = await getServerSession(authOptions);
  return (session as any)?.accessToken as string | undefined;
}