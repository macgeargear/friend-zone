import { AuthOptions } from "./../../../../../node_modules/next-auth/core/types.d";
import { EmailConfig } from "./../../../../../node_modules/next-auth/providers/email.d";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);
    const RESTResponse = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/user:email${emailToAdd}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    const data = (await RESTResponse.json()) as { result: string };
    const idToAdd = data.result;

    if (!idToAdd) {
      return new Response("This person does not exist.", { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (idToAdd === session?.user.id) {
      return new Response("You cannot add yourself as a friend", {
        status: 400,
      });
    }

    // valid request
    console.log(data);
  } catch (error) {}
}
